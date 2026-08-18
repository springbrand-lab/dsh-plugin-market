import { createRequire } from 'node:module'
import type { Readable } from 'node:stream'
import {
  pluginArguments,
  runPluginCommand,
  withReleaseAgeRecovery,
  type PluginAction,
} from './command.ts'
import { listProfiles, readProfileState, type ProfileState } from './profile.ts'
import { restartCurrentProcess } from './restart.ts'

const MARKETPLACE_PACKAGE = '@springbrand/dsh-plugin-marketplace'
const MARKETPLACE_VERSION = (createRequire(import.meta.url)('../package.json') as { version: string }).version

/** Operations shared by the ordinary DSH and Desktop marketplace routes. */
export interface MarketplaceManager {
  readonly currentProfile: string
  listProfiles(): Promise<ProfileState[]>
  runPlugin(profile: string, action: PluginAction, packageName: string, signal: AbortSignal): Promise<void>
  restart(delayMs: number): void | Promise<void>
}

/** Desktop profile facts consumed without importing the Desktop package at runtime. */
export interface DesktopProfilesLike {
  readonly current: { readonly name: string; readonly dir: string }
  restart(): Promise<void>
}

interface DesktopPnpmOutcome {
  readonly exitCode: number | null
  readonly signal: NodeJS.Signals | null
}

interface DesktopPnpmHandleLike {
  readonly stdout: Readable
  readonly stderr: Readable
  readonly done: Promise<DesktopPnpmOutcome>
}

/** Desktop package-manager operation consumed through its supported interface. */
export interface DesktopPnpmLike {
  run(args: readonly string[], signal?: AbortSignal): DesktopPnpmHandleLike
  runPlugin(args: readonly string[], invokingDir: string, signal?: AbortSignal): DesktopPnpmHandleLike
}

/** Keep bounded process output for a useful operation failure. */
function collectOutput(streams: readonly Readable[]): () => string {
  let output = ''
  const collect = (chunk: unknown): void => {
    output = `${output}${String(chunk)}`.slice(-64_000)
  }
  for (const stream of streams) stream.on('data', collect)
  return () => output.trim()
}

/** Keep the Desktop-owned marketplace row out of the profile bundle list. */
function selfArguments(action: PluginAction, packageName: string, installed: boolean): string[] {
  if (action === 'remove') return ['remove', '--config.minimumReleaseAge=0', packageName]
  if (action === 'install' || !installed) {
    return ['add', '--config.minimumReleaseAge=0', `${packageName}@latest`]
  }
  return pluginArguments('update', packageName)
}

/** Use the running Desktop generation as the only profile and process owner. */
export function desktopManager(
  profiles: DesktopProfilesLike,
  pnpm: DesktopPnpmLike,
): MarketplaceManager {
  const current = profiles.current
  const runPlugin = async (
    profile: string,
    action: PluginAction,
    packageName: string,
    signal: AbortSignal,
  ): Promise<void> => {
    if (profile !== current.name) {
      throw new Error(`Desktop can only modify its active profile: ${current.name}`)
    }
    const selfPackage = packageName === MARKETPLACE_PACKAGE
    const installed = selfPackage
      && Object.hasOwn((await readProfileState(current.name, current.dir)).dependencies, packageName)
    const args = selfPackage
      ? selfArguments(action, packageName, installed)
      : pluginArguments(action, packageName)
    await withReleaseAgeRecovery(action, packageName, async (operationArgs) => {
      const operation = selfPackage
        ? pnpm.run(operationArgs, signal)
        : pnpm.runPlugin(operationArgs, current.dir, signal)
      const output = collectOutput([operation.stdout, operation.stderr])
      const outcome = await operation.done
      if (outcome.exitCode !== 0) {
        throw new Error(output() || `package operation failed (${outcome.signal ?? String(outcome.exitCode)})`)
      }
    }, args)
  }
  return {
    currentProfile: current.name,
    listProfiles: async () => [{
      ...await readProfileState(current.name, current.dir),
      bundledDependencies: { [MARKETPLACE_PACKAGE]: MARKETPLACE_VERSION },
    }],
    runPlugin,
    restart: () => profiles.restart(),
  }
}

/** Preserve the existing CLI implementation outside Desktop. */
export function ordinaryManager(profile: string): MarketplaceManager {
  return {
    currentProfile: profile,
    listProfiles: () => listProfiles(profile),
    runPlugin: (target, action, packageName, signal) =>
      runPluginCommand(target, action, packageName, signal),
    restart: restartCurrentProcess,
  }
}

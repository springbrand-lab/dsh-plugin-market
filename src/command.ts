import { spawn } from 'node:child_process'

export type PluginAction = 'install' | 'update' | 'remove'

const RELEASE_AGE_OVERRIDE = '--config.minimumReleaseAge=0'

export interface Invocation {
  command: string
  args: string[]
}

/** Convert one marketplace action into arguments accepted by `dsh plugin`. */
export function pluginArguments(action: PluginAction, packageName: string): string[] {
  return action === 'install'
    ? ['add', packageName]
    : action === 'update'
      ? ['update', '--latest', RELEASE_AGE_OVERRIDE, packageName]
      : ['remove', packageName]
}

/** Retry a removal once when a young lockfile entry blocks pnpm verification. */
export async function withReleaseAgeRecovery(
  action: PluginAction,
  packageName: string,
  run: (args: string[]) => Promise<void>,
  args: string[] = pluginArguments(action, packageName),
): Promise<void> {
  try {
    await run(args)
  } catch (cause) {
    if (
      action !== 'remove'
      || args.includes(RELEASE_AGE_OVERRIDE)
      || !(cause instanceof Error)
      || !/ERR_PNPM_(?:MINIMUM_RELEASE_AGE_VIOLATION|NO_MATURE_MATCHING_VERSION)/.test(cause.message)
    ) throw cause
    await run(['remove', RELEASE_AGE_OVERRIDE, packageName])
  }
}

function buildPluginInvocation(
  profile: string,
  pluginArgs: readonly string[],
  argv: readonly string[] = process.argv,
  execArgv: readonly string[] = process.execArgv,
): Invocation {
  const entry = argv[1]
  if (entry === undefined) throw new Error('cannot locate the running DSH CLI entry point')
  return {
    command: process.execPath,
    args: [...execArgv, entry, 'plugin', '--profile', profile, ...pluginArgs],
  }
}

/** Build the same Node CLI entry invocation used by the running DSH process. */
export function buildInvocation(
  profile: string,
  action: PluginAction,
  packageName: string,
  argv: readonly string[] = process.argv,
  execArgv: readonly string[] = process.execArgv,
): Invocation {
  return buildPluginInvocation(profile, pluginArguments(action, packageName), argv, execArgv)
}

async function runInvocation(invocation: Invocation, signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...(signal === undefined ? {} : { signal }),
    })
    let output = ''
    const collect = (chunk: Buffer): void => {
      output = `${output}${chunk.toString()}`.slice(-64_000)
    }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(output.trim() || `dsh plugin failed (${signal ?? String(code)})`))
    })
  })
}

/** Run one official `dsh plugin` operation without a shell. */
export async function runPluginCommand(
  profile: string,
  action: PluginAction,
  packageName: string,
  signal?: AbortSignal,
): Promise<void> {
  await withReleaseAgeRecovery(action, packageName, async (args) => {
    await runInvocation(buildPluginInvocation(profile, args), signal)
  })
}

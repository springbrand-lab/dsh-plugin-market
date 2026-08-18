import { readFile, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { isNpmPackageName } from './catalog.ts'

export interface ProfileState {
  name: string
  dependencies: Record<string, string>
  /** Exact versions read from installed package manifests. */
  versions?: Record<string, string>
  /** App-owned packages that can be updated through a profile override. */
  bundledDependencies?: Record<string, string>
}

/** Resolve the DSH home using the launcher precedence relevant to plugins. */
export function dshHome(): string {
  const configured = process.env.DSH_HOME?.trim()
  return resolve(configured === undefined || configured === '' ? `${homedir()}/.dsh` : configured)
}

/** Reject names that can escape or collide with DSH's profiles directory. */
export function assertProfileName(name: string): void {
  if (name === '' || name === '.' || name === '..' || name === 'node_modules'
    || name.includes('/') || name.includes('\\')) {
    throw new Error(`invalid profile: ${JSON.stringify(name)}`)
  }
}

export function profileDirectory(name: string): string {
  assertProfileName(name)
  return resolve(dshHome(), 'profiles', name)
}

async function dependencies(directory: string): Promise<Record<string, string>> {
  try {
    const raw = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8')) as unknown
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
    const value = (raw as Record<string, unknown>).dependencies
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
    return Object.fromEntries(Object.entries(value).filter(
      (item): item is [string, string] => typeof item[1] === 'string',
    ))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw error
  }
}

async function installedVersions(
  directory: string,
  packageNames: readonly string[],
): Promise<Record<string, string>> {
  const versions: Record<string, string> = {}
  await Promise.all(packageNames.filter(isNpmPackageName).map(async (packageName) => {
    try {
      const value = JSON.parse(await readFile(
        resolve(directory, 'node_modules', packageName, 'package.json'),
        'utf8',
      )) as { version?: unknown }
      if (typeof value.version === 'string' && value.version.trim() !== '') {
        versions[packageName] = value.version.trim()
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }))
  return versions
}

/** Read one profile dependency snapshot from an authoritative directory. */
export async function readProfileState(name: string, directory: string = profileDirectory(name)): Promise<ProfileState> {
  assertProfileName(name)
  const declared = await dependencies(directory)
  const versions = await installedVersions(directory, Object.keys(declared))
  return {
    name,
    dependencies: declared,
    ...(Object.keys(versions).length === 0 ? {} : { versions }),
  }
}

/** List initialized profiles plus the two built-in names DSH can initialize. */
export async function listProfiles(current: string): Promise<ProfileState[]> {
  assertProfileName(current)
  const names = new Set(['web', 'headless', current])
  try {
    const rows = await readdir(resolve(dshHome(), 'profiles'), { withFileTypes: true })
    for (const row of rows) {
      if (row.isDirectory() && row.name !== 'node_modules') names.add(row.name)
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  return Promise.all([...names].sort().map(name => readProfileState(name)))
}

/** Read `--profile <name>` from the current DSH launch. */
export function launchedProfile(argv: readonly string[] = process.argv): string | undefined {
  const index = argv.indexOf('--profile')
  const value = argv[index + 1]
  return index === -1 || value === undefined || value.startsWith('-') ? undefined : value
}

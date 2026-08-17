/**
 * Profile enumeration over a DSH home: which profiles the marketplace offers
 * as install targets, and what it reports as already installed in each.
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { dshHome, listProfiles, readProfileState } from '../src/profile.ts'

let home: string
let previous: string | undefined

/** Seed one profile directory, optionally with a package.json. */
function seed(name: string, dependencies?: Record<string, string>): void {
  const dir = join(home, 'profiles', name)
  mkdirSync(dir, { recursive: true })
  if (dependencies !== undefined) {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies }))
  }
}

beforeEach(() => {
  previous = process.env.DSH_HOME
  home = mkdtempSync(join(tmpdir(), 'dsh-market-profile-'))
  process.env.DSH_HOME = home
})

afterEach(() => {
  if (previous === undefined) delete process.env.DSH_HOME
  else process.env.DSH_HOME = previous
  rmSync(home, { recursive: true, force: true })
})

describe('DSH home resolution', () => {
  it('follows DSH_HOME over the default location', () => {
    expect(dshHome()).toBe(home)
  })

  it('falls back to the default when DSH_HOME is blank', () => {
    process.env.DSH_HOME = '   '
    expect(dshHome().endsWith('.dsh')).toBe(true)
  })
})

describe('profile enumeration', () => {
  it('offers both built-in profiles before either directory exists', async () => {
    expect((await listProfiles('web')).map(row => row.name)).toEqual(['headless', 'web'])
  })

  it('adds every initialized profile and sorts the result', async () => {
    seed('staging')
    seed('audit')
    expect((await listProfiles('web')).map(row => row.name))
      .toEqual(['audit', 'headless', 'staging', 'web'])
  })

  it('includes the running profile even when it is neither built-in nor on disk', async () => {
    expect((await listProfiles('desktop')).map(row => row.name))
      .toEqual(['desktop', 'headless', 'web'])
  })

  it('never offers the profiles/node_modules directory as a target', async () => {
    seed('node_modules')
    expect((await listProfiles('web')).map(row => row.name)).not.toContain('node_modules')
  })

  it('reports each profile its own dependencies', async () => {
    seed('web', { '@scope/one': '1.0.0' })
    seed('headless', { '@scope/two': '2.0.0' })
    const rows = await listProfiles('web')
    expect(rows.find(row => row.name === 'web')?.dependencies).toEqual({ '@scope/one': '1.0.0' })
    expect(rows.find(row => row.name === 'headless')?.dependencies).toEqual({ '@scope/two': '2.0.0' })
  })
})

describe('profile state', () => {
  it('reads no dependencies from an uninitialized profile', async () => {
    await expect(readProfileState('web')).resolves.toEqual({ name: 'web', dependencies: {} })
  })

  it('ignores a package.json without a dependencies map', async () => {
    seed('web')
    writeFileSync(join(home, 'profiles', 'web', 'package.json'), JSON.stringify({ name: 'p' }))
    await expect(readProfileState('web')).resolves.toEqual({ name: 'web', dependencies: {} })
  })

  it('drops non-string dependency values rather than reporting them installed', async () => {
    seed('web')
    writeFileSync(
      join(home, 'profiles', 'web', 'package.json'),
      JSON.stringify({ dependencies: { good: '1.0.0', bad: { version: '2.0.0' } } }),
    )
    await expect(readProfileState('web')).resolves.toEqual({
      name: 'web',
      dependencies: { good: '1.0.0' },
    })
  })

  it('refuses a profile name that would escape the profiles directory', async () => {
    await expect(readProfileState('../outside')).rejects.toThrow('invalid profile')
  })
})

import { describe, expect, it } from 'vitest'
import { buildInvocation } from '../src/command.ts'
import { assertProfileName, launchedProfile } from '../src/profile.ts'

describe('DSH command delegation', () => {
  it('builds the official plugin command without a shell', () => {
    const invocation = buildInvocation(
      'web',
      'install',
      '@springbrand/example',
      ['/usr/bin/node', '/opt/dsh/bin.js', '--profile', 'web'],
      ['--enable-source-maps'],
    )
    expect(invocation).toEqual({
      command: process.execPath,
      args: [
        '--enable-source-maps',
        '/opt/dsh/bin.js',
        'plugin',
        '--profile',
        'web',
        'add',
        '@springbrand/example',
      ],
    })
  })

  it('updates an installed plugin to the latest published version', () => {
    const invocation = buildInvocation(
      'web',
      'update',
      '@springbrand/example',
      ['/usr/bin/node', '/opt/dsh/bin.js'],
      [],
    )
    expect(invocation.args).toEqual([
      '/opt/dsh/bin.js',
      'plugin',
      '--profile',
      'web',
      'update',
      '--latest',
      '--config.minimumReleaseAge=0',
      '@springbrand/example',
    ])
  })

  it('reads and validates profile names', () => {
    expect(launchedProfile(['node', 'dsh', '--profile', 'preview'])).toBe('preview')
    expect(() => { assertProfileName('../outside') }).toThrow('invalid profile')
    expect(() => { assertProfileName('node_modules') }).toThrow('invalid profile')
    expect(() => { assertProfileName('preview') }).not.toThrow()
  })
})

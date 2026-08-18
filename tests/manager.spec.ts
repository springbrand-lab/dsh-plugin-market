import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PassThrough } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { desktopManager, type DesktopPnpmLike } from '../src/manager.ts'

describe('Desktop marketplace manager', () => {
  it('uses only the active profile and delegates lifecycle operations', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dshmarket-desktop-'))
    try {
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { '@springbrand/existing': '1.2.3' } }))
      const restart = vi.fn(async () => {})
      const runPlugin = vi.fn(() => {
        const stdout = new PassThrough()
        const stderr = new PassThrough()
        stdout.end('installed')
        stderr.end()
        return { stdout, stderr, done: Promise.resolve({ exitCode: 0, signal: null }) }
      })
      const manager = desktopManager(
        { current: { name: 'desktop', dir }, restart },
        { runPlugin } as DesktopPnpmLike,
      )
      const signal = AbortSignal.timeout(1_000)

      await expect(manager.listProfiles()).resolves.toEqual([{
        name: 'desktop',
        dependencies: { '@springbrand/existing': '1.2.3' },
        bundledDependencies: { '@springbrand/dsh-plugin-marketplace': expect.any(String) },
      }])
      await manager.runPlugin('desktop', 'install', '@springbrand/example', signal)
      expect(runPlugin).toHaveBeenCalledWith(['add', '@springbrand/example'], dir, signal)
      await manager.runPlugin('desktop', 'update', '@springbrand/dsh-plugin-marketplace', signal)
      expect(runPlugin).toHaveBeenLastCalledWith(
        ['add', '--config.minimumReleaseAge=0', '@springbrand/dsh-plugin-marketplace@latest'],
        dir,
        signal,
      )
      writeFileSync(join(dir, 'package.json'), JSON.stringify({
        dependencies: {
          '@springbrand/existing': '1.2.3',
          '@springbrand/dsh-plugin-marketplace': '1.0.6',
        },
      }))
      await manager.runPlugin('desktop', 'update', '@springbrand/dsh-plugin-marketplace', signal)
      expect(runPlugin).toHaveBeenLastCalledWith([
        'update',
        '--latest',
        '--config.minimumReleaseAge=0',
        '@springbrand/dsh-plugin-marketplace',
      ], dir, signal)
      await expect(manager.runPlugin('web', 'remove', '@springbrand/example', signal))
        .rejects.toThrow('Desktop can only modify its active profile: desktop')
      await manager.restart(1_500)
      expect(restart).toHaveBeenCalledOnce()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

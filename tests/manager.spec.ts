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
      const operation = () => {
        const stdout = new PassThrough()
        const stderr = new PassThrough()
        stdout.end('installed')
        stderr.end()
        return { stdout, stderr, done: Promise.resolve({ exitCode: 0, signal: null }) }
      }
      const run = vi.fn(operation)
      const runPlugin = vi.fn(operation)
      const manager = desktopManager(
        { current: { name: 'desktop', dir }, restart },
        { run, runPlugin } as DesktopPnpmLike,
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
      expect(run).toHaveBeenLastCalledWith(
        ['add', '--config.minimumReleaseAge=0', '@springbrand/dsh-plugin-marketplace@latest'],
        signal,
      )
      writeFileSync(join(dir, 'package.json'), JSON.stringify({
        dependencies: {
          '@springbrand/existing': '1.2.3',
          '@springbrand/dsh-plugin-marketplace': '1.0.6',
        },
      }))
      await manager.runPlugin('desktop', 'update', '@springbrand/dsh-plugin-marketplace', signal)
      expect(run).toHaveBeenLastCalledWith([
        'update',
        '--latest',
        '--config.minimumReleaseAge=0',
        '@springbrand/dsh-plugin-marketplace',
      ], signal)
      await manager.runPlugin('desktop', 'remove', '@springbrand/dsh-plugin-marketplace', signal)
      expect(run).toHaveBeenLastCalledWith([
        'remove',
        '--config.minimumReleaseAge=0',
        '@springbrand/dsh-plugin-marketplace',
      ], signal)
      await expect(manager.runPlugin('web', 'remove', '@springbrand/example', signal))
        .rejects.toThrow('Desktop can only modify its active profile: desktop')
      await manager.restart(1_500)
      expect(restart).toHaveBeenCalledOnce()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('retries removal when a young lockfile entry blocks pnpm verification', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dshmarket-release-age-'))
    try {
      writeFileSync(join(dir, 'package.json'), JSON.stringify({
        dependencies: { '@springbrand/example': '1.0.0' },
      }))
      const operation = (exitCode: number, error = '') => {
        const stdout = new PassThrough()
        const stderr = new PassThrough()
        const done = Promise.resolve().then(() => {
          stdout.end()
          stderr.end(error)
          return { exitCode, signal: null }
        })
        return { stdout, stderr, done }
      }
      const runPlugin = vi.fn()
        .mockReturnValueOnce(operation(1, 'ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION'))
        .mockReturnValueOnce(operation(0))
      const manager = desktopManager(
        { current: { name: 'desktop', dir }, restart: vi.fn(async () => {}) },
        { run: vi.fn(), runPlugin } as unknown as DesktopPnpmLike,
      )
      const signal = AbortSignal.timeout(1_000)

      await expect(manager.runPlugin('desktop', 'remove', '@springbrand/example', signal)).resolves.toBeUndefined()
      expect(runPlugin).toHaveBeenNthCalledWith(1, ['remove', '@springbrand/example'], dir, signal)
      expect(runPlugin).toHaveBeenNthCalledWith(2, [
        'remove',
        '--config.minimumReleaseAge=0',
        '@springbrand/example',
      ], dir, signal)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

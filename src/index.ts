import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { DEFAULT_CATALOG_URL, isNpmPackageName, loadCatalog } from './catalog.ts'
import type { PluginAction } from './command.ts'
import { assertMutationRequest, HttpError, readJsonObject, sendJson } from './http.ts'
import {
  desktopManager,
  ordinaryManager,
  type DesktopPnpmLike,
  type DesktopProfilesLike,
  type MarketplaceManager,
} from './manager.ts'
import { assertProfileName, launchedProfile } from './profile.ts'

export const name = 'springbrand-plugin-marketplace'
export const inject = ['webServer', 'loader']

const API = '/springbrand-market'

export interface Config {
  profile?: string
  catalogUrl?: string
  restartDelayMs?: number
}

interface WebServerLike {
  register(route: {
    kind: 'exact'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

interface HostContext extends Context {
  webServer: WebServerLike
}

interface ResolvedConfig {
  profile: string
  catalogUrl: string
  restartDelayMs: number
}

function stringField(body: Record<string, unknown>, key: string): string {
  const value = body[key]
  if (typeof value !== 'string' || value.trim() === '') throw new HttpError(400, `${key} 无效`)
  return value.trim()
}

function actionField(body: Record<string, unknown>): PluginAction {
  const action = body.action
  if (action === 'install' || action === 'update' || action === 'remove') return action
  throw new HttpError(400, 'action 无效')
}

async function installedPackage(
  manager: MarketplaceManager,
  profile: string,
  packageName: string,
): Promise<boolean> {
  const row = (await manager.listProfiles()).find(item => item.name === profile)
  return row !== undefined && Object.hasOwn(row.dependencies, packageName)
}

async function resolvePackage(
  body: Record<string, unknown>,
  action: PluginAction,
  config: ResolvedConfig,
): Promise<string> {
  if (action === 'install') {
    const id = stringField(body, 'id')
    const entry = (await loadCatalog(config.catalogUrl)).find(item => item.id === id)
    if (entry?.installable !== true || entry.packageName === undefined) {
      throw new HttpError(400, '该目录项不能通过 npm 安装')
    }
    return entry.packageName
  }
  const packageName = stringField(body, 'packageName')
  if (!isNpmPackageName(packageName)) throw new HttpError(400, 'npm 包名无效')
  return packageName
}

async function mutate(
  body: Record<string, unknown>,
  config: ResolvedConfig,
  manager: MarketplaceManager,
  operation: { running: boolean },
): Promise<unknown> {
  if (operation.running) throw new HttpError(409, '另一个插件操作正在进行')
  operation.running = true
  try {
    const action = actionField(body)
    const profile = stringField(body, 'profile')
    try {
      assertProfileName(profile)
    } catch (error) {
      throw new HttpError(400, error instanceof Error ? error.message : String(error))
    }
    const packageName = await resolvePackage(body, action, config)
    if (action !== 'install' && !(await installedPackage(manager, profile, packageName))) {
      throw new HttpError(404, `${packageName} 未安装在 ${profile}`)
    }
    await manager.runPlugin(profile, action, packageName, AbortSignal.timeout(5 * 60_000))
    return {
      ok: true,
      action,
      packageName,
      profile,
      restartRequired: profile === manager.currentProfile,
    }
  } finally {
    operation.running = false
  }
}

function route(
  ctx: HostContext,
  path: string,
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> | void,
): () => void {
  return ctx.webServer.register({
    kind: 'exact',
    path: `${API}${path}`,
    handler: async (req, res) => {
      try {
        await handler(req, res)
      } catch (error) {
        const status = error instanceof HttpError ? error.status : 500
        const message = error instanceof Error ? error.message : String(error)
        ctx.logger.warn(error instanceof Error ? error : new Error(message))
        if (!res.headersSent) sendJson(res, status, { error: message })
        else res.destroy()
      }
    },
  })
}

function resolveConfig(config: Config | undefined): ResolvedConfig {
  const profile = config?.profile ?? launchedProfile() ?? 'web'
  assertProfileName(profile)
  const catalogUrl = config?.catalogUrl ?? DEFAULT_CATALOG_URL
  const parsed = new URL(catalogUrl)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('catalogUrl 必须是 HTTP(S) 地址')
  }
  const restartDelayMs = config?.restartDelayMs ?? 1_500
  if (!Number.isInteger(restartDelayMs) || restartDelayMs < 500 || restartDelayMs > 30_000) {
    throw new Error('restartDelayMs 必须是 500-30000 之间的整数')
  }
  return { profile, catalogUrl: parsed.toString(), restartDelayMs }
}

/** Register the marketplace's local HTTP API. */
export function apply(rawContext: Context, input?: Config): void {
  const ctx = rawContext as HostContext
  const config = resolveConfig(input)
  const services = rawContext as unknown as {
    get(name: string): unknown
    inject(names: string[], callback: (context: Context) => void): void
  }
  const desktopProfiles = services.get('desktopProfiles') as DesktopProfilesLike | undefined
  if (desktopProfiles === undefined) {
    mount(ctx, config, ordinaryManager(config.profile))
    return
  }
  services.inject(['desktopPnpm'], (desktopContext) => {
    const desktopPnpm = (desktopContext as unknown as { get(name: string): unknown })
      .get('desktopPnpm') as DesktopPnpmLike | undefined
    if (desktopPnpm === undefined) throw new Error('Desktop 缺少 desktopPnpm service')
    mount(desktopContext as HostContext, config, desktopManager(desktopProfiles, desktopPnpm))
  })
}

function mount(ctx: HostContext, config: ResolvedConfig, manager: MarketplaceManager): void {
  const operation = { running: false }
  ctx.effect(() => {
    const disposers = [
      route(ctx, '/catalog', async (req, res) => {
        if (req.method !== 'GET') throw new HttpError(405, '仅支持 GET')
        sendJson(res, 200, { plugins: await loadCatalog(config.catalogUrl) })
      }),
      route(ctx, '/profiles', async (req, res) => {
        if (req.method !== 'GET') throw new HttpError(405, '仅支持 GET')
        sendJson(res, 200, { currentProfile: manager.currentProfile, profiles: await manager.listProfiles() })
      }),
      route(ctx, '/action', async (req, res) => {
        assertMutationRequest(req)
        sendJson(res, 200, await mutate(await readJsonObject(req), config, manager, operation))
      }),
      route(ctx, '/restart', async (req, res) => {
        assertMutationRequest(req)
        if (operation.running) throw new HttpError(409, '插件操作尚未完成')
        await readJsonObject(req)
        sendJson(res, 202, { ok: true })
        res.once('finish', () => {
          void Promise.resolve(manager.restart(config.restartDelayMs)).catch((cause: unknown) => {
            ctx.logger.warn(cause instanceof Error ? cause : new Error(String(cause)))
          })
        })
      }),
    ]
    return () => { for (const dispose of disposers) dispose() }
  }, 'springbrand-plugin-marketplace: routes')
}

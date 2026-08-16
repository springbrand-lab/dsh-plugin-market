import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { DEFAULT_CATALOG_URL, isNpmPackageName, loadCatalog } from './catalog.ts'
import { runPluginCommand, type PluginAction } from './command.ts'
import { assertMutationRequest, HttpError, readJsonObject, sendJson } from './http.ts'
import { assertProfileName, launchedProfile, listProfiles } from './profile.ts'
import { restartCurrentProcess } from './restart.ts'

export const name = 'springbrand-plugin-marketplace'
export const inject = ['webServer']

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

let operationRunning = false

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

async function installedPackage(profile: string, packageName: string): Promise<boolean> {
  const row = (await listProfiles(profile)).find(item => item.name === profile)
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

async function mutate(body: Record<string, unknown>, config: ResolvedConfig): Promise<unknown> {
  if (operationRunning) throw new HttpError(409, '另一个插件操作正在进行')
  operationRunning = true
  try {
    const action = actionField(body)
    const profile = stringField(body, 'profile')
    try {
      assertProfileName(profile)
    } catch (error) {
      throw new HttpError(400, error instanceof Error ? error.message : String(error))
    }
    const packageName = await resolvePackage(body, action, config)
    if (action !== 'install' && !(await installedPackage(profile, packageName))) {
      throw new HttpError(404, `${packageName} 未安装在 ${profile}`)
    }
    await runPluginCommand(profile, action, packageName)
    return {
      ok: true,
      action,
      packageName,
      profile,
      restartRequired: profile === config.profile,
    }
  } finally {
    operationRunning = false
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
  ctx.effect(() => {
    const disposers = [
      route(ctx, '/catalog', async (req, res) => {
        if (req.method !== 'GET') throw new HttpError(405, '仅支持 GET')
        sendJson(res, 200, { plugins: await loadCatalog(config.catalogUrl) })
      }),
      route(ctx, '/profiles', async (req, res) => {
        if (req.method !== 'GET') throw new HttpError(405, '仅支持 GET')
        sendJson(res, 200, { currentProfile: config.profile, profiles: await listProfiles(config.profile) })
      }),
      route(ctx, '/action', async (req, res) => {
        assertMutationRequest(req)
        sendJson(res, 200, await mutate(await readJsonObject(req), config))
      }),
      route(ctx, '/restart', async (req, res) => {
        assertMutationRequest(req)
        if (operationRunning) throw new HttpError(409, '插件操作尚未完成')
        await readJsonObject(req)
        sendJson(res, 202, { ok: true })
        res.once('finish', () => { restartCurrentProcess(config.restartDelayMs) })
      }),
    ]
    return () => { for (const dispose of disposers) dispose() }
  }, 'springbrand-plugin-marketplace: routes')
}

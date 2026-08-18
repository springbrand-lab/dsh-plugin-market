import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { DEFAULT_CATALOG_URL, isNpmPackageName, loadCatalog } from './catalog.ts'
import type { PluginAction } from './command.ts'
import { assertMutationRequest, errorBody, HttpError, readJsonObject, sendJson } from './http.ts'
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
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, 'error.fieldInvalid', `invalid ${key}`, { field: key })
  }
  return value.trim()
}

function actionField(body: Record<string, unknown>): PluginAction {
  const action = body.action
  if (action === 'install' || action === 'update' || action === 'remove') return action
  throw new HttpError(400, 'error.actionInvalid', 'invalid action')
}

async function installedPackage(
  manager: MarketplaceManager,
  profile: string,
  packageName: string,
  includeBundled: boolean,
): Promise<boolean> {
  const row = (await manager.listProfiles()).find(item => item.name === profile)
  return row !== undefined && (
    Object.hasOwn(row.dependencies, packageName)
    || (includeBundled && Object.hasOwn(row.bundledDependencies ?? {}, packageName))
  )
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
      throw new HttpError(400, 'error.notInstallable', 'catalog entry is not installable from npm')
    }
    return entry.packageName
  }
  const packageName = stringField(body, 'packageName')
  if (!isNpmPackageName(packageName)) {
    throw new HttpError(400, 'error.packageNameInvalid', 'invalid npm package name')
  }
  return packageName
}

async function mutate(
  body: Record<string, unknown>,
  config: ResolvedConfig,
  manager: MarketplaceManager,
  operation: { running: boolean },
): Promise<unknown> {
  if (operation.running) {
    throw new HttpError(409, 'error.operationRunning', 'another plugin operation is running')
  }
  operation.running = true
  try {
    const action = actionField(body)
    const profile = stringField(body, 'profile')
    try {
      assertProfileName(profile)
    } catch (error) {
      throw new HttpError(
        400,
        'error.profileInvalid',
        error instanceof Error ? error.message : String(error),
        { profile },
      )
    }
    const packageName = await resolvePackage(body, action, config)
    if (action !== 'install'
      && !(await installedPackage(manager, profile, packageName, action === 'update'))) {
      throw new HttpError(
        404,
        'error.notInstalled',
        `${packageName} is not installed in ${profile}`,
        { packageName, profile },
      )
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
        const body = errorBody(error)
        ctx.logger.warn(error instanceof Error ? error : new Error(body.error))
        if (!res.headersSent) sendJson(res, status, body)
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
    throw new Error('catalogUrl must be an HTTP(S) address')
  }
  const restartDelayMs = config?.restartDelayMs ?? 1_500
  if (!Number.isInteger(restartDelayMs) || restartDelayMs < 500 || restartDelayMs > 30_000) {
    throw new Error('restartDelayMs must be an integer between 500 and 30000')
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
    if (desktopPnpm === undefined) throw new Error('Desktop is missing the desktopPnpm service')
    mount(desktopContext as HostContext, config, desktopManager(desktopProfiles, desktopPnpm))
  })
}

function mount(ctx: HostContext, config: ResolvedConfig, manager: MarketplaceManager): void {
  const operation = { running: false }
  ctx.effect(() => {
    const disposers = [
      route(ctx, '/catalog', async (req, res) => {
        if (req.method !== 'GET') throw new HttpError(405, 'error.methodNotAllowed', 'GET only')
        sendJson(res, 200, { plugins: await loadCatalog(config.catalogUrl) })
      }),
      route(ctx, '/profiles', async (req, res) => {
        if (req.method !== 'GET') throw new HttpError(405, 'error.methodNotAllowed', 'GET only')
        sendJson(res, 200, { currentProfile: manager.currentProfile, profiles: await manager.listProfiles() })
      }),
      route(ctx, '/action', async (req, res) => {
        assertMutationRequest(req)
        sendJson(res, 200, await mutate(await readJsonObject(req), config, manager, operation))
      }),
      route(ctx, '/restart', async (req, res) => {
        assertMutationRequest(req)
        if (operation.running) {
          throw new HttpError(409, 'error.restartPending', 'a plugin operation is still running')
        }
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

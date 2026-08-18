const REAL_ENTITY_TYPES = new Set([
  'bundle',
  'skill',
  'agent-preset',
  'mcp-server',
  'cordis-plugin',
])

export const DEFAULT_CATALOG_URL = 'https://dshplugin.market/api/catalog'

export interface CatalogEntry {
  id: string
  name: string
  owner: string
  icon?: string
  url: string
  page?: string
  description: string
  descriptions?: { en?: string; zh?: string }
  category: string
  entityType: string
  stars: number
  language?: string
  license?: string
  packageName?: string
  installable: boolean
  runsInstallScripts: boolean
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}

function httpUrl(value: unknown): string | undefined {
  const raw = text(value)
  if (raw === undefined) return undefined
  try {
    const parsed = new URL(raw)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : undefined
  } catch {
    return undefined
  }
}

function githubAvatar(repositoryUrl: string): string | undefined {
  const parsed = new URL(repositoryUrl)
  if (parsed.hostname !== 'github.com') return undefined
  const owner = parsed.pathname.split('/').filter(Boolean)[0]
  return owner === undefined ? undefined : `https://github.com/${encodeURIComponent(owner)}.png?size=96`
}

/** Accept npm registry package names, never paths, URLs, aliases, or shell text. */
export function isNpmPackageName(value: string): boolean {
  if (value.length > 214 || value !== value.toLowerCase()) return false
  return /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(value)
}

function description(value: unknown, fallback: string): Pick<CatalogEntry, 'description' | 'descriptions'> {
  const direct = text(value)
  if (direct !== undefined) return { description: direct }
  const translations = record(value)
  const en = text(translations?.en)
  const zh = text(translations?.zh)
  return {
    description: en ?? zh ?? fallback,
    ...(en === undefined && zh === undefined ? {} : {
      descriptions: {
        ...(en === undefined ? {} : { en }),
        ...(zh === undefined ? {} : { zh }),
      },
    }),
  }
}

function entryId(row: Record<string, unknown>, owner: string, name: string): string {
  const explicit = text(row.id)
  if (explicit !== undefined) return explicit
  const page = text(row.page)
  if (page !== undefined) {
    try {
      const part = new URL(page).pathname.split('/').filter(Boolean).at(-1)
      if (part !== undefined) return part
    } catch {
      // A malformed optional page URL falls back to a stable local id.
    }
  }
  return `${owner}/${name}`.toLowerCase().replace(/[^a-z0-9._/-]+/g, '-')
}

function normalize(rowValue: unknown): CatalogEntry | undefined {
  const row = record(rowValue)
  if (row === undefined) return undefined
  const entityType = text(row.entityType) ?? text(row.entity_type)
  const name = text(row.name)
  const owner = text(row.owner)
  const url = httpUrl(row.url)
  if (entityType === undefined || !REAL_ENTITY_TYPES.has(entityType)
    || name === undefined || owner === undefined || url === undefined) return undefined

  const packageName = text(row.packageName) ?? text(row.npm)
  const installability = text(row.installability)
  const installMethod = text(row.installMethod) ?? text(row.install_method)
  const category = text(row.category) ?? entityType
  const summary = description(row.description, name)
  const page = httpUrl(row.page)
  const language = text(row.language)
  const license = text(row.license)
  const icon = githubAvatar(url)

  return {
    id: entryId(row, owner, name),
    name,
    owner,
    ...(icon === undefined ? {} : { icon }),
    url,
    ...(page === undefined ? {} : { page }),
    ...summary,
    category,
    entityType,
    stars: number(row.stars),
    ...(language === undefined ? {} : { language }),
    ...(license === undefined ? {} : { license }),
    ...(packageName === undefined ? {} : { packageName }),
    installable: entityType === 'bundle'
      && installability === 'installable'
      && installMethod === 'npm'
      && packageName !== undefined
      && isNpmPackageName(packageName),
    runsInstallScripts: row.runsInstallScripts === true || row.runs_install_scripts === true,
  }
}

/** Convert either the public API response or plugins.json export into UI rows. */
export function parseCatalog(value: unknown): CatalogEntry[] {
  const rows = record(value)?.plugins
  if (!Array.isArray(rows)) throw new Error('plugin catalog is missing the plugins array')
  const unique = new Map<string, CatalogEntry>()
  for (const value of rows) {
    const entry = normalize(value)
    if (entry !== undefined && !unique.has(entry.id)) unique.set(entry.id, entry)
  }
  return [...unique.values()].sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name))
}

/** Fetch and validate the configured plugin directory. */
export async function loadCatalog(url: string): Promise<CatalogEntry[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => { controller.abort() }, 15_000)
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`plugin catalog request failed (HTTP ${String(response.status)})`)
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('json')) throw new Error('plugin catalog did not return JSON')
    return parseCatalog(await response.json())
  } finally {
    clearTimeout(timeout)
  }
}

/** Compact GitHub star counts for card metadata. */
export function formatStars(stars: number): string {
  if (stars < 1_000) return String(Math.round(stars))
  const thousands = stars / 1_000
  return `${thousands < 100 ? Number(thousands.toFixed(1)) : Math.round(thousands)}k`
}

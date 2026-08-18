import { useEffect, useState } from 'react'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.mjs'
import Package from 'lucide-react/dist/esm/icons/package.mjs'
import Star from 'lucide-react/dist/esm/icons/star.mjs'
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert.mjs'
import { formatStars, hasUpdate } from '../catalog.ts'
import { en, type MarketplaceKey, type MarketplaceTranslate } from './locales.ts'

const API = '/springbrand-market'
const MARKETPLACE_PACKAGE = '@springbrand/dsh-plugin-marketplace'
const OPERATION_KEY = 'springbrand-market:last-operation'
const PAGE_SIZES = [24, 48, 96] as const

interface Plugin {
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

interface Profile {
  name: string
  dependencies: Record<string, string>
  versions?: Record<string, string>
  bundledDependencies?: Record<string, string>
}

interface ProfilesResponse {
  currentProfile: string
  profiles: Profile[]
}

type Action = 'install' | 'update' | 'remove'

interface Draft {
  action: Action
  id?: string
  packageName: string
  title: string
}

interface ActionResponse {
  ok: true
  restartRequired: boolean
  packageName: string
  profile: string
}

const ENTITY_KEYS: Record<string, MarketplaceKey> = {
  bundle: 'entity.bundle',
  skill: 'entity.skill',
  'agent-preset': 'entity.agentPreset',
  'mcp-server': 'entity.mcpServer',
  'cordis-plugin': 'entity.cordisPlugin',
  installed: 'entity.installed',
}

const ACTION_KEYS: Record<Action, MarketplaceKey> = {
  install: 'action.install',
  update: 'action.update',
  remove: 'action.remove',
}

function entityLabel(t: MarketplaceTranslate, entity: string): string {
  const key = ENTITY_KEYS[entity]
  return key === undefined ? entity : t(key)
}

/**
 * Render a failure in the UI language. The host sends a locale key for every
 * failure it raises; its `error` text is English for the DSH log and is only
 * shown when an unexpected throw arrives with no key to translate.
 */
function failureText(
  t: MarketplaceTranslate,
  status: number,
  value: { error?: unknown; code?: unknown; params?: unknown },
): string {
  if (typeof value.code === 'string' && Object.hasOwn(en, value.code)) {
    const params = typeof value.params === 'object' && value.params !== null
      ? value.params as Record<string, unknown>
      : undefined
    return t(value.code as MarketplaceKey, params)
  }
  return typeof value.error === 'string' ? value.error : t('requestFailed', { status })
}

async function json<T>(t: MarketplaceTranslate, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: init?.body === undefined ? undefined : { 'content-type': 'application/json' },
    cache: 'no-store',
  })
  const value = await response.json() as { error?: unknown; code?: unknown; params?: unknown }
  if (!response.ok) throw new Error(failureText(t, response.status, value))
  return value as T
}

async function npmLatestVersion(packageName: string, signal: AbortSignal): Promise<string | undefined> {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`, {
    headers: { accept: 'application/json' },
    signal,
  })
  if (!response.ok) return undefined
  const value = await response.json() as { version?: unknown }
  return typeof value.version === 'string' && value.version !== '' ? value.version : undefined
}

function actionText(t: MarketplaceTranslate, action: Action): string {
  return t(ACTION_KEYS[action])
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => { setTimeout(resolve, milliseconds) })
}

async function reloadAfterRestart(t: MarketplaceTranslate): Promise<void> {
  await sleep(2_000)
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      await json<ProfilesResponse>(t, '/profiles')
      window.location.reload()
      return
    } catch {
      await sleep(600)
    }
  }
  throw new Error(t('restartTimeout'))
}

function installedOnlyRows(
  profile: Profile | undefined,
  catalog: Plugin[],
  t: MarketplaceTranslate,
): Plugin[] {
  if (profile === undefined) return []
  const byPackage = new Map(catalog.flatMap(plugin => plugin.packageName === undefined ? [] : [[plugin.packageName, plugin]]))
  const dependencies = { ...profile.bundledDependencies, ...profile.dependencies }
  return Object.entries(dependencies).map(([packageName, version]) => byPackage.get(packageName) ?? {
    id: `installed:${packageName}`,
    name: packageName,
    owner: t('profileDependency'),
    url: '',
    description: t('dependencySource', { source: version }),
    category: 'installed',
    entityType: 'installed',
    stars: 0,
    packageName,
    installable: true,
    runsInstallScripts: false,
  })
}

function descriptionOf(plugin: Plugin, locale: string): string {
  return locale === 'zh'
    ? plugin.descriptions?.zh ?? plugin.description
    : plugin.descriptions?.en ?? plugin.description
}

/** Plugin marketplace settings section. */
export function Marketplace({ t }: { t: MarketplaceTranslate }) {
  const [catalog, setCatalog] = useState<Plugin[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentProfile, setCurrentProfile] = useState('web')
  const [selectedProfile, setSelectedProfile] = useState('web')
  const [installedOnly, setInstalledOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [entity, setEntity] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(24)
  const [draft, setDraft] = useState<Draft>()
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [latestVersions, setLatestVersions] = useState<Record<string, string>>({})
  const locale = t('locale')

  const loadProfiles = async (): Promise<ProfilesResponse> => {
    const value = await json<ProfilesResponse>(t, '/profiles')
    setProfiles(value.profiles)
    setCurrentProfile(value.currentProfile)
    setSelectedProfile(previous => value.profiles.some(profile => profile.name === previous)
      ? previous
      : value.currentProfile)
    return value
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(OPERATION_KEY)
    if (saved !== null) {
      sessionStorage.removeItem(OPERATION_KEY)
      setStatus(saved)
    }
    Promise.all([
      json<{ plugins: Plugin[] }>(t, '/catalog'),
      loadProfiles(),
    ]).then(([directory]) => {
      setCatalog(directory.plugins)
    }).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause))
    }).finally(() => { setLoading(false) })
  }, [])

  useEffect(() => { setPage(1) }, [query, entity, installedOnly, selectedProfile, pageSize])
  useEffect(() => {
    const profile = profiles.find(item => item.name === selectedProfile)
    if (profile === undefined) {
      setLatestVersions({})
      return
    }
    const installed = new Set(Object.keys({ ...profile.bundledDependencies, ...profile.dependencies }))
    const packageNames = [...new Set(catalog.flatMap(plugin => (
      plugin.installable && plugin.packageName !== undefined && installed.has(plugin.packageName)
        ? [plugin.packageName]
        : []
    )))]
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8_000)])
    setLatestVersions({})
    void Promise.all(packageNames.map(async packageName => [
      packageName,
      await npmLatestVersion(packageName, signal).catch(() => undefined),
    ] as const)).then((rows) => {
      if (!controller.signal.aborted) {
        setLatestVersions(Object.fromEntries(rows.filter(
          (row): row is readonly [string, string] => row[1] !== undefined,
        )))
      }
    })
    return () => { controller.abort() }
  }, [catalog, profiles, selectedProfile])
  useEffect(() => {
    if (draft === undefined) return
    const close = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !busy) setDraft(undefined)
    }
    window.addEventListener('keydown', close)
    return () => { window.removeEventListener('keydown', close) }
  }, [draft, busy])

  const selected = profiles.find(profile => profile.name === selectedProfile)
  const activeProfile = profiles.find(profile => profile.name === currentProfile)
  const marketplaceVersion = activeProfile?.versions?.[MARKETPLACE_PACKAGE]
    ?? activeProfile?.bundledDependencies?.[MARKETPLACE_PACKAGE]
  const dependencies = { ...selected?.bundledDependencies, ...selected?.dependencies }
  const currentVersions = { ...selected?.bundledDependencies, ...selected?.versions }
  const installedNames = new Set(Object.keys(dependencies))
  const updateCount = catalog.filter(plugin => plugin.packageName !== undefined
    && installedNames.has(plugin.packageName)
    && hasUpdate(currentVersions[plugin.packageName], latestVersions[plugin.packageName])).length
  const rows = installedOnly ? installedOnlyRows(selected, catalog, t) : catalog
  const types = [...new Set(rows.map(plugin => plugin.entityType))]
  const typeCounts = new Map<string, number>()
  for (const plugin of rows) typeCounts.set(plugin.entityType, (typeCounts.get(plugin.entityType) ?? 0) + 1)
  const filtered = rows.filter((plugin) => {
    if (entity !== 'all' && plugin.entityType !== entity) return false
    const needle = query.trim().toLowerCase()
    return needle === '' || `${plugin.name} ${plugin.owner} ${plugin.description} ${Object.values(plugin.descriptions ?? {}).join(' ')} ${plugin.packageName ?? ''}`
      .toLowerCase().includes(needle)
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const submit = async (): Promise<void> => {
    if (draft === undefined) return
    setBusy(true)
    setError('')
    try {
      const result = await json<ActionResponse>(t, '/action', {
        method: 'POST',
        body: JSON.stringify({
          action: draft.action,
          profile: selectedProfile,
          ...(draft.action === 'install' ? { id: draft.id } : { packageName: draft.packageName }),
        }),
      })
      const message = t('actionCompleted', { title: draft.title, action: actionText(t, draft.action) })
      if (result.restartRequired) {
        sessionStorage.setItem(OPERATION_KEY, t('restarted', { message }))
        setStatus(t('restarting', { message }))
        await json(t, '/restart', { method: 'POST', body: '{}' })
        await reloadAfterRestart(t)
      } else {
        setStatus(t('nextStart', { message, profile: selectedProfile }))
        setDraft(undefined)
        await loadProfiles()
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="sb-market" aria-label={t('title')}>
      <style>{MARKET_STYLE}</style>
      <header className="sb-head">
        <div>
          <div className="sb-title">
            <h2>{t('title')}</h2>
            {marketplaceVersion !== undefined && (
              <span className="sb-market-version" title={t('marketplaceVersion', { version: marketplaceVersion })}>
                v{marketplaceVersion}
              </span>
            )}
          </div>
          <p>{t('intro')}</p>
        </div>
        <label className="sb-profile">
          <span>{t('targetProfile')}</span>
          <span className="sb-select-wrap">
            <select aria-label={t('targetProfile')} value={selectedProfile} onChange={event => { setSelectedProfile(event.target.value) }}>
              {profiles.map(profile => <option key={profile.name}>{profile.name}</option>)}
            </select>
            <ChevronDown aria-hidden="true" />
          </span>
        </label>
      </header>

      <div className="sb-toolbar">
        <div className="sb-tabs" role="tablist" aria-label={t('scope')}>
          <button type="button" role="tab" aria-selected={!installedOnly} onClick={() => { setInstalledOnly(false); setEntity('all') }}>{t('discover')}</button>
          <button type="button" role="tab" aria-selected={installedOnly} onClick={() => { setInstalledOnly(true); setEntity('all') }}>
            {t('installed')} ({Object.keys(dependencies).length})
            {updateCount > 0 && <span className="sb-tab-update">{t('updatesCount', { count: updateCount })}</span>}
          </button>
        </div>
        <input
          type="search"
          value={query}
          onChange={event => { setQuery(event.target.value) }}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchAria')}
        />
      </div>

      <nav className="sb-categories" aria-label={t('categories')}>
        <button type="button" aria-pressed={entity === 'all'} onClick={() => { setEntity('all') }}>{t('all')} <span>{rows.length}</span></button>
        {types.map(type => (
          <button key={type} type="button" aria-pressed={entity === type} onClick={() => { setEntity(type) }}>
            {entityLabel(t, type)} <span>{typeCounts.get(type) ?? 0}</span>
          </button>
        ))}
      </nav>

      {(status !== '' || error !== '') && (
        <div className={error === '' ? 'sb-notice' : 'sb-notice sb-error'} role="status">
          {error || status}
          <button type="button" aria-label={t('closeNotice')} onClick={() => { setError(''); setStatus('') }}>×</button>
        </div>
      )}

      <div className="sb-results">
        {loading ? <p className="sb-empty">{t('loading')}</p> : visible.length === 0 ? <p className="sb-empty">{t('empty')}</p> : visible.map((plugin) => {
          const installed = plugin.packageName !== undefined && installedNames.has(plugin.packageName)
          const currentVersion = plugin.packageName === undefined ? undefined : currentVersions[plugin.packageName]
          const latestVersion = plugin.packageName === undefined ? undefined : latestVersions[plugin.packageName]
          const updateAvailable = hasUpdate(currentVersion, latestVersion)
          return (
            <article className="sb-card" key={plugin.id}>
              <div className="sb-card-title">
                <div className="sb-icon">
                  {plugin.icon === undefined
                    ? <Package aria-hidden="true" />
                    : <>
                        <span aria-hidden="true">{plugin.name.charAt(0).toUpperCase()}</span>
                        <img src={plugin.icon} alt="" width="48" height="48" loading="lazy" decoding="async" onError={event => { event.currentTarget.hidden = true }} />
                      </>}
                </div>
                <div className="sb-heading">
                  <h3>{plugin.name}</h3>
                  <p>{plugin.owner}</p>
                </div>
              </div>
              <p className="sb-description">{descriptionOf(plugin, locale)}</p>
              <div className="sb-card-meta">
                <span className="sb-kind">{entityLabel(t, plugin.entityType)}</span>
                {currentVersion !== undefined && <span className="sb-version">v{currentVersion}</span>}
                {updateAvailable && <span className="sb-update">{t('updateAvailable')}</span>}
                {plugin.runsInstallScripts && <span className="sb-warning" title={t('installScriptsTitle')}><TriangleAlert aria-hidden="true" />{t('installScripts')}</span>}
                {plugin.stars > 0 && <span className="sb-stars" aria-label={t('stars', { count: plugin.stars })}><Star aria-hidden="true" />{formatStars(plugin.stars)}</span>}
              </div>
              <footer>
                <div className="sb-meta">
                  {plugin.packageName && <code>{plugin.packageName}</code>}
                  {plugin.language && <span>{plugin.language}</span>}
                </div>
                <div className="sb-actions">
                  {plugin.url !== '' && <a href={plugin.page ?? plugin.url} target="_blank" rel="noreferrer">{t('details')}</a>}
                  {installed && plugin.packageName !== undefined ? (
                    <>
                      {currentVersion !== undefined && latestVersion === currentVersion
                        ? <span className="sb-muted">{t('upToDate')}</span>
                        : <button className={updateAvailable ? 'sb-primary' : undefined} type="button" onClick={() => { setDraft({ action: 'update', packageName: plugin.packageName!, title: plugin.name }) }}>
                            {updateAvailable ? t('updateTo', { version: latestVersion }) : t('update')}
                          </button>}
                      {Object.hasOwn(selected?.dependencies ?? {}, plugin.packageName) && (
                        <button className="sb-danger" type="button" onClick={() => { setDraft({ action: 'remove', packageName: plugin.packageName!, title: plugin.name }) }}>{t('remove')}</button>
                      )}
                    </>
                  ) : plugin.installable && plugin.packageName !== undefined ? (
                    <button className="sb-primary" type="button" onClick={() => { setDraft({ action: 'install', id: plugin.id, packageName: plugin.packageName!, title: plugin.name }) }}>{t('install')}</button>
                  ) : <span className="sb-muted">{t('displayOnly')}</span>}
                </div>
              </footer>
            </article>
          )
        })}
      </div>

      <footer className="sb-pager">
        <span>{t('total', { count: filtered.length })}</span>
        <div>
          <button type="button" disabled={safePage <= 1} onClick={() => { setPage(safePage - 1) }}>{t('previous')}</button>
          <strong>{safePage} / {pageCount}</strong>
          <button type="button" disabled={safePage >= pageCount} onClick={() => { setPage(safePage + 1) }}>{t('next')}</button>
        </div>
        <label>{t('perPage')} <select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)) }}>{PAGE_SIZES.map(size => <option key={size}>{size}</option>)}</select></label>
      </footer>

      {draft !== undefined && (
        <div className="sb-overlay">
          <div className="sb-dialog" role="dialog" aria-modal="true" aria-labelledby="sb-dialog-title">
            <h3 id="sb-dialog-title">{t('confirm', { action: t(draft.action) })}</h3>
            <p>{t('dialogTargetBefore', { action: actionText(t, draft.action) })}<strong>{selectedProfile}</strong>{t('dialogTargetAfter', { action: actionText(t, draft.action) })}</p>
            <code>{draft.packageName}</code>
            {selectedProfile === currentProfile && <p className="sb-restart-note">{t('restartNote')}</p>}
            <div className="sb-dialog-actions">
              <button type="button" disabled={busy} onClick={() => { setDraft(undefined) }}>{t('cancel')}</button>
              <button className={draft.action === 'remove' ? 'sb-danger' : 'sb-primary'} type="button" disabled={busy} autoFocus onClick={() => { void submit() }}>
                {busy ? t('running') : t('confirm', { action: t(draft.action) })}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

const MARKET_STYLE = `
.sb-market{box-sizing:border-box;height:100%;min-height:500px;display:flex;flex-direction:column;gap:12px;color:inherit;overflow:hidden}
.sb-market *{box-sizing:border-box}
.sb-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.sb-title{display:flex;align-items:baseline;gap:8px;margin-bottom:4px}.sb-head h2{font-size:20px;margin:0}.sb-market-version{font-size:11px;font-weight:650;opacity:.48;font-variant-numeric:tabular-nums}.sb-head p{margin:0;opacity:.62;font-size:13px}
.sb-profile{display:flex;align-items:center;gap:9px;font-size:12px;white-space:nowrap}.sb-profile>span:first-child{opacity:.66}
.sb-market select,.sb-market input,.sb-market button,.sb-market a{font:inherit}
.sb-market select,.sb-market input{height:36px;border:0;border-radius:11px;background:color-mix(in srgb,currentColor 7%,transparent);color:inherit;padding:0 12px}
.sb-market :is(button,a,input,select):focus-visible{outline:2px solid #6f8cff;outline-offset:2px}.sb-select-wrap{position:relative;display:block}.sb-profile select{width:108px;appearance:none;padding:0 32px 0 12px;cursor:pointer}.sb-profile select:hover{background:color-mix(in srgb,currentColor 11%,transparent)}.sb-profile option{background:#2d2d30;color:#f2f2f3}.sb-select-wrap svg{position:absolute;right:10px;top:50%;width:14px;height:14px;transform:translateY(-50%);pointer-events:none;opacity:.62}
.sb-toolbar{display:grid;grid-template-columns:auto minmax(180px,1fr);gap:10px;align-items:center}
.sb-tabs{display:flex;gap:18px}
.sb-tabs button{border:0;border-radius:0;background:transparent;color:inherit;padding:6px 0;text-decoration:none;opacity:.58;cursor:pointer}.sb-tabs button:hover{opacity:1}.sb-tabs button[aria-selected=true]{background:transparent;color:#91a8ff;box-shadow:inset 0 -2px currentColor;font-weight:650;opacity:1}.sb-tab-update{margin-left:7px;font-size:11px;font-weight:650}
.sb-categories{display:flex;align-items:center;gap:14px;overflow-x:auto;padding:0 1px 2px;scrollbar-width:none}.sb-categories::-webkit-scrollbar{display:none}.sb-categories button{height:28px;flex:none;border:0;background:transparent;color:inherit;padding:0;font-size:12px;opacity:.5;cursor:pointer}.sb-categories button:hover{opacity:.82}.sb-categories button[aria-pressed=true]{color:#91a8ff;font-weight:650;opacity:1}.sb-categories span{margin-left:3px;font-size:10px;opacity:.56;font-variant-numeric:tabular-nums}
.sb-notice{display:flex;justify-content:space-between;gap:12px;border:0;background:color-mix(in srgb,#4ea871 12%,transparent);border-radius:11px;padding:9px 12px;font-size:13px}
.sb-notice button{border:0;background:none;color:inherit;cursor:pointer}.sb-error{background:color-mix(in srgb,#d85d5d 12%,transparent)}
.sb-results{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:minmax(0,1fr);align-content:start;gap:4px;padding:2px 5px 4px 2px}
.sb-card{min-height:198px;display:flex;flex-direction:column;border:0;border-radius:11px;padding:14px 8px;background:transparent;transition:background .16s ease}
.sb-card:hover{background:color-mix(in srgb,currentColor 4%,transparent)}
.sb-card-title{display:flex;align-items:flex-start;gap:11px;min-width:0}
.sb-icon{position:relative;width:46px;height:46px;flex:0 0 46px;display:grid;place-items:center;overflow:hidden;border:0;border-radius:12px;background:color-mix(in srgb,currentColor 8%,transparent);font-size:17px;font-weight:700;opacity:.9}
.sb-icon>svg{width:21px;height:21px;opacity:.58}.sb-icon img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sb-heading{min-width:0;padding-top:2px}.sb-card h3{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;line-height:1.35;margin:0 0 4px}.sb-card-title p{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;margin:0;opacity:.58}
.sb-description{min-height:39px;font-size:13px;line-height:1.5;opacity:.7;margin:12px 0 10px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.sb-card-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:auto;min-height:23px}
.sb-kind,.sb-warning,.sb-update{display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-size:11px;font-weight:600}
.sb-kind{color:color-mix(in srgb,#7fa3ff 85%,currentColor)}
.sb-warning{color:#e8a91c}.sb-warning svg{width:13px;height:13px}
.sb-version{font-size:11px;font-weight:650;opacity:.48;font-variant-numeric:tabular-nums}.sb-update{color:#6fc58d}.sb-update::before{width:5px;height:5px;border-radius:50%;background:currentColor;content:""}
.sb-stars{display:inline-flex;align-items:center;gap:4px;margin-left:auto;color:#f5b82e;font-size:12px;font-weight:650;font-variant-numeric:tabular-nums}.sb-stars svg{width:14px;height:14px;fill:currentColor}
.sb-card footer{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px;padding-top:4px;border:0}
.sb-meta{min-width:0;display:flex;align-items:center;gap:7px;font-size:11px;opacity:.58}.sb-meta code{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:145px}
.sb-meta code,.sb-dialog code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.sb-actions{display:flex;align-items:center;gap:9px;white-space:nowrap}.sb-actions button,.sb-actions a{border:0;background:transparent;color:inherit;font-size:12px;padding:5px 2px;text-decoration:none;opacity:.62;cursor:pointer}.sb-actions a{border:1px solid color-mix(in srgb,currentColor 22%,transparent);border-radius:8px;padding:5px 9px}.sb-actions button:hover,.sb-actions a:hover{opacity:1}.sb-actions .sb-primary,.sb-dialog-actions .sb-primary{border:1px solid #587ff0;border-radius:8px;background:#587ff0;color:#fff;padding:6px 10px;opacity:1}.sb-actions .sb-primary:hover,.sb-dialog-actions .sb-primary:hover{background:#6a8df4}.sb-actions .sb-danger,.sb-dialog-actions .sb-danger{background:transparent;color:#ed8585}.sb-dialog-actions button{border:0;border-radius:8px;background:color-mix(in srgb,currentColor 7%,transparent);color:inherit;padding:7px 11px;cursor:pointer}
.sb-muted{font-size:12px;opacity:.45}.sb-empty{grid-column:1/-1;align-self:center;text-align:center;opacity:.55;padding:48px}
.sb-pager{flex:none;min-height:44px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;border:0;padding-top:8px;font-size:12px}.sb-pager>div{display:flex;align-items:center;gap:12px}.sb-pager>label{justify-self:end}.sb-pager button{border:0;background:transparent;color:inherit;padding:6px 2px;opacity:.62;cursor:pointer}.sb-pager button:hover:not(:disabled){opacity:1}.sb-pager button:disabled{opacity:.25;cursor:not-allowed}.sb-pager select{height:30px;padding:0 8px}
.sb-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:rgba(0,0,0,.58);padding:20px}.sb-dialog{width:min(420px,100%);border:0;border-radius:16px;background:#29292c;color:#f2f2f3;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.45)}.sb-dialog h3{margin:0 0 12px}.sb-dialog p{font-size:13px;opacity:.75}.sb-dialog>code{display:block;border-radius:10px;background:rgba(255,255,255,.07);padding:10px;overflow-wrap:anywhere}.sb-dialog .sb-restart-note{color:#f5b82e}.sb-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}.sb-dialog-actions button:disabled{opacity:.55;cursor:wait}
@media(max-width:700px){.sb-market{height:calc(100vh - 170px)}.sb-head{align-items:stretch;flex-direction:column}.sb-profile{justify-content:space-between}.sb-toolbar{grid-template-columns:1fr}.sb-tabs{grid-column:1/-1}.sb-toolbar input{width:100%}.sb-results{grid-template-columns:1fr}.sb-card{min-height:196px}.sb-card footer{align-items:stretch;flex-direction:column}.sb-actions{justify-content:flex-end}.sb-pager{grid-template-columns:1fr auto}.sb-pager>span{display:none}.sb-pager>label{justify-self:end}}
`

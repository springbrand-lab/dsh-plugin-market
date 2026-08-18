import { useEffect, useState } from 'react'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.mjs'
import Package from 'lucide-react/dist/esm/icons/package.mjs'
import Star from 'lucide-react/dist/esm/icons/star.mjs'
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert.mjs'
import { formatStars } from '../catalog.ts'
import { en, type MarketplaceKey, type MarketplaceTranslate } from './locales.ts'

const API = '/springbrand-market'
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
    description: t('installedVersion', { version }),
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
    if (draft === undefined) return
    const close = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !busy) setDraft(undefined)
    }
    window.addEventListener('keydown', close)
    return () => { window.removeEventListener('keydown', close) }
  }, [draft, busy])

  const selected = profiles.find(profile => profile.name === selectedProfile)
  const dependencies = { ...selected?.bundledDependencies, ...selected?.dependencies }
  const installedNames = new Set(Object.keys(dependencies))
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
          <h2>{t('title')}</h2>
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
          <button type="button" role="tab" aria-selected={installedOnly} onClick={() => { setInstalledOnly(true); setEntity('all') }}>{t('installed')} ({Object.keys(dependencies).length})</button>
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
                {plugin.runsInstallScripts && <span className="sb-warning" title={t('installScriptsTitle')}><TriangleAlert aria-hidden="true" />{t('installScripts')}</span>}
                <span className="sb-stars" aria-label={t('stars', { count: plugin.stars })}><Star aria-hidden="true" />{formatStars(plugin.stars)}</span>
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
                      <button type="button" onClick={() => { setDraft({ action: 'update', packageName: plugin.packageName!, title: plugin.name }) }}>{t('update')}</button>
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
.sb-head h2{font-size:20px;margin:0 0 4px}.sb-head p{margin:0;opacity:.62;font-size:13px}
.sb-profile{display:flex;align-items:center;gap:9px;font-size:12px;white-space:nowrap}.sb-profile>span:first-child{opacity:.66}
.sb-market select,.sb-market input,.sb-market button,.sb-market a{font:inherit}
.sb-market select,.sb-market input{height:34px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;background:color-mix(in srgb,currentColor 5%,transparent);color:inherit;padding:0 10px}
.sb-select-wrap{position:relative;display:block}.sb-profile select{width:108px;appearance:none;border-radius:9px;background:color-mix(in srgb,currentColor 7%,transparent);padding:0 32px 0 12px;cursor:pointer}.sb-profile select:hover{border-color:color-mix(in srgb,currentColor 30%,transparent);background:color-mix(in srgb,currentColor 10%,transparent)}.sb-profile select:focus-visible{outline:2px solid #5b8cff;outline-offset:2px;border-color:transparent}.sb-profile option{background:#2d2d30;color:#f2f2f3}.sb-select-wrap svg{position:absolute;right:10px;top:50%;width:14px;height:14px;transform:translateY(-50%);pointer-events:none;opacity:.62}
.sb-toolbar{display:grid;grid-template-columns:auto minmax(180px,1fr);gap:10px;align-items:center}
.sb-tabs{display:flex;gap:4px}
.sb-tabs button,.sb-pager button,.sb-actions button,.sb-actions a,.sb-dialog-actions button{border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;background:transparent;color:inherit;padding:7px 11px;text-decoration:none;cursor:pointer}
.sb-tabs button[aria-selected=true]{background:color-mix(in srgb,#5b8cff 24%,transparent);border-color:#5b8cff;color:inherit}
.sb-categories{display:flex;align-items:center;gap:6px;overflow-x:auto;padding:0 1px 2px;scrollbar-width:none}.sb-categories::-webkit-scrollbar{display:none}.sb-categories button{height:28px;flex:none;border:1px solid transparent;border-radius:999px;background:transparent;color:inherit;padding:0 10px;font-size:12px;opacity:.66;cursor:pointer}.sb-categories button:hover{opacity:1;background:color-mix(in srgb,currentColor 5%,transparent)}.sb-categories button[aria-pressed=true]{border-color:color-mix(in srgb,currentColor 24%,transparent);background:color-mix(in srgb,currentColor 8%,transparent);opacity:1}.sb-categories span{margin-left:3px;font-size:10px;opacity:.56;font-variant-numeric:tabular-nums}
.sb-notice{display:flex;justify-content:space-between;gap:12px;border:1px solid color-mix(in srgb,#4ea871 55%,transparent);background:color-mix(in srgb,#4ea871 12%,transparent);border-radius:8px;padding:8px 10px;font-size:13px}
.sb-notice button{border:0;background:none;color:inherit;cursor:pointer}.sb-error{border-color:#d85d5d;background:color-mix(in srgb,#d85d5d 12%,transparent)}
.sb-results{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;gap:12px;padding:2px 5px 4px 2px}
.sb-card{min-height:208px;display:flex;flex-direction:column;border:1px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:9px;padding:14px;background:color-mix(in srgb,currentColor 3%,transparent);transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}
.sb-card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,#5b8cff 42%,transparent);box-shadow:0 8px 22px color-mix(in srgb,#5b8cff 8%,transparent)}
.sb-card-title{display:flex;align-items:flex-start;gap:11px;min-width:0}
.sb-icon{position:relative;width:46px;height:46px;flex:0 0 46px;display:grid;place-items:center;overflow:hidden;border:1px solid color-mix(in srgb,currentColor 15%,transparent);border-radius:9px;background:color-mix(in srgb,currentColor 6%,transparent);font-size:17px;font-weight:700;opacity:.9}
.sb-icon>svg{width:21px;height:21px;opacity:.58}.sb-icon img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sb-heading{min-width:0;padding-top:2px}.sb-card h3{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;line-height:1.35;margin:0 0 4px}.sb-card-title p{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;margin:0;opacity:.58}
.sb-description{min-height:39px;font-size:13px;line-height:1.5;opacity:.7;margin:12px 0 10px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.sb-card-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:auto;min-height:23px}
.sb-kind,.sb-warning{display:inline-flex;align-items:center;gap:4px;height:22px;border-radius:6px;padding:0 7px;white-space:nowrap;font-size:11px;font-weight:600}
.sb-kind{background:color-mix(in srgb,#5b8cff 12%,transparent);color:color-mix(in srgb,#7fa3ff 85%,currentColor)}
.sb-warning{background:color-mix(in srgb,#f5b82e 11%,transparent);color:#e8a91c}.sb-warning svg{width:13px;height:13px}
.sb-stars{display:inline-flex;align-items:center;gap:4px;margin-left:auto;color:#f5b82e;font-size:12px;font-weight:650;font-variant-numeric:tabular-nums}.sb-stars svg{width:14px;height:14px;fill:currentColor}
.sb-card footer{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:11px;padding-top:10px;border-top:1px solid color-mix(in srgb,currentColor 10%,transparent)}
.sb-meta{min-width:0;display:flex;align-items:center;gap:7px;font-size:11px;opacity:.58}.sb-meta code{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:145px}
.sb-meta code,.sb-dialog code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.sb-actions{display:flex;align-items:center;gap:6px;white-space:nowrap}.sb-actions button,.sb-actions a{font-size:12px;padding:5px 9px}.sb-actions .sb-primary,.sb-dialog-actions .sb-primary{background:#4f7fe8;border-color:#4f7fe8;color:#fff}.sb-actions .sb-danger,.sb-dialog-actions .sb-danger{border-color:#cf6262;color:#ed8585}
.sb-muted{font-size:12px;opacity:.45}.sb-empty{grid-column:1/-1;align-self:center;text-align:center;opacity:.55;padding:48px}
.sb-pager{flex:none;min-height:44px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;border-top:1px solid color-mix(in srgb,currentColor 14%,transparent);padding-top:10px;font-size:12px}.sb-pager>div{display:flex;align-items:center;gap:10px}.sb-pager>label{justify-self:end}.sb-pager button{padding:6px 10px}.sb-pager button:disabled{opacity:.35;cursor:not-allowed}.sb-pager select{height:30px;padding:0 6px}
.sb-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:rgba(0,0,0,.58);padding:20px}.sb-dialog{width:min(420px,100%);border:1px solid color-mix(in srgb,currentColor 20%,transparent);border-radius:14px;background:#29292c;color:#f2f2f3;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.45)}.sb-dialog h3{margin:0 0 12px}.sb-dialog p{font-size:13px;opacity:.75}.sb-dialog>code{display:block;border-radius:8px;background:rgba(255,255,255,.07);padding:10px;overflow-wrap:anywhere}.sb-dialog .sb-restart-note{color:#f5b82e}.sb-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}.sb-dialog-actions button:disabled{opacity:.55;cursor:wait}
@media(max-width:700px){.sb-market{height:calc(100vh - 170px)}.sb-head{align-items:stretch;flex-direction:column}.sb-profile{justify-content:space-between}.sb-toolbar{grid-template-columns:1fr}.sb-tabs{grid-column:1/-1}.sb-toolbar input{width:100%}.sb-results{grid-template-columns:1fr}.sb-card{min-height:196px}.sb-card footer{align-items:stretch;flex-direction:column}.sb-actions{justify-content:flex-end}.sb-pager{grid-template-columns:1fr auto}.sb-pager>span{display:none}.sb-pager>label{justify-self:end}}
`

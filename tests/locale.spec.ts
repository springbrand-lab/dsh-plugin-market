import { describe, expect, it } from 'vitest'
import { apply, inject } from '../src/client/index.ts'
import { en, NS, zh, type MarketplaceKey, type MarketplaceTranslate } from '../src/client/locales.ts'

describe('marketplace locale', () => {
  it('registers bilingual copy and follows the system locale', () => {
    let active: 'en' | 'zh' = 'en'
    let dictionaries: Record<'en' | 'zh', Record<string, string>> = { en: {}, zh: {} }
    let entry: { label?: string | (() => string); locale?: string } | undefined
    const t: MarketplaceTranslate = (key, params) => {
      const template = dictionaries[active][key] ?? key
      return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        params !== undefined && name in params ? String(params[name]) : match)
    }
    const ctx = {
      effect(start: () => void | (() => void)) { start() },
      locale: {
        register(namespace: string, values: Record<'en' | 'zh', Record<string, string>>) {
          expect(namespace).toBe(NS)
          dictionaries = values
          return () => {}
        },
        bind(namespace: string) {
          expect(namespace).toBe(NS)
          return t
        },
      },
      slots: {
        inject(name: string, mount: () => void) {
          expect(name).toBe('settings.section')
          mount()
        },
        register(options: typeof entry) {
          entry = options
          return () => {}
        },
      },
    }

    apply(ctx as never)

    expect(inject).toEqual(['slots', 'locale'])
    expect(entry?.locale).toBe(NS)
    expect(typeof entry?.label).toBe('function')
    expect((entry?.label as () => string)()).toBe('Plugin Marketplace')
    active = 'zh'
    expect((entry?.label as () => string)()).toBe('插件市场')
  })

  it('ships the same keys in both languages', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort())
    expect(zh satisfies Record<MarketplaceKey, string>).toBe(zh)
  })
})

import { describe, expect, it } from 'vitest'
import { formatStars, isNpmPackageName, parseCatalog } from '../src/catalog.ts'

describe('plugin catalog', () => {
  it('keeps real DSH entities but only enables audited npm bundles', () => {
    const plugins = parseCatalog({ plugins: [
      {
        name: 'Bundle', owner: 'springbrand', url: 'https://github.com/springbrand/bundle', page: 'https://example.com/plugins/bundle',
        description: 'Ready', entity_type: 'bundle', npm: '@springbrand/bundle', stars: 12_345,
        install_method: 'npm', installability: 'installable', runs_install_scripts: false,
      },
      {
        name: 'Skill', owner: 'springbrand', url: 'https://example.com/skill', description: 'Display only',
        entity_type: 'skill', npm: null, stars: 2, install_method: 'not-applicable', installability: 'installable',
      },
      {
        name: 'Ordinary repo', owner: 'springbrand', url: 'https://example.com/repo', description: 'No',
        entity_type: 'unknown', stars: 999_999, install_method: 'unknown', installability: 'not-a-plugin',
      },
      {
        name: 'Unsafe link', owner: 'springbrand', url: 'javascript:alert(1)', description: 'No',
        entity_type: 'bundle', npm: 'unsafe', stars: 3, install_method: 'npm', installability: 'installable',
      },
    ] })

    expect(plugins.map(plugin => plugin.name)).toEqual(['Bundle', 'Skill'])
    expect(plugins[0]).toMatchObject({
      id: 'bundle',
      icon: 'https://github.com/springbrand.png?size=96',
      packageName: '@springbrand/bundle',
      installable: true,
    })
    expect(plugins[1]?.installable).toBe(false)
  })

  it('rejects command-like specs and formats star counts', () => {
    expect(isNpmPackageName('@springbrand/plugin')).toBe(true)
    expect(isNpmPackageName('github:owner/repo')).toBe(false)
    expect(isNpmPackageName('plugin; rm -rf x')).toBe(false)
    expect(formatStars(999)).toBe('999')
    expect(formatStars(12_345)).toBe('12.3k')
    expect(formatStars(106_863)).toBe('107k')
  })

  it('keeps bilingual catalog descriptions for the active UI locale', () => {
    const [plugin] = parseCatalog({ plugins: [{
      name: 'Bundle',
      owner: 'springbrand',
      url: 'https://example.com/bundle',
      description: { en: 'English summary', zh: '中文简介' },
      entity_type: 'bundle',
      npm: '@springbrand/bundle',
      install_method: 'npm',
      installability: 'installable',
    }] })

    expect(plugin).toMatchObject({
      description: 'English summary',
      descriptions: { en: 'English summary', zh: '中文简介' },
    })
  })
})

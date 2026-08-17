import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { Marketplace } from './Marketplace.tsx'
import { en, NS, zh } from './locales.ts'

export const inject = ['slots', 'locale']

/** Add the marketplace as an independent Web Settings section. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'plugin-marketplace: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'springbrand-plugin-marketplace',
    order: 50,
    label: () => t('nav'),
    locale: NS,
  }, Marketplace))
}

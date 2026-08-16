import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { Marketplace } from './Marketplace.tsx'

export const inject = ['slots']

/** Add the marketplace as an independent Web Settings section. */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'springbrand-plugin-marketplace',
    order: 50,
    label: '插件市场',
  }, Marketplace))
}

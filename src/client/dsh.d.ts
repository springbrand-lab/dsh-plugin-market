declare module '@deepseek-ai/dsh-client-runtime/client' {
  type MarketplaceTranslate = import('./locales.ts').MarketplaceTranslate

  export interface ClientContext {
    effect(callback: () => void | (() => void), label: string): void
    locale: {
      register(
        namespace: string,
        dictionaries: Record<'en' | 'zh', Record<string, string>>,
      ): () => void
      bind(namespace: string): MarketplaceTranslate
    }
    slots: {
      inject(name: string, register: () => void | (() => void)): void
      register(
        options: {
          name: string
          id: string
          order?: number
          label?: string | (() => string)
          locale?: string
        },
        component: import('react').ComponentType<{ t: MarketplaceTranslate }>,
      ): () => void
    }
  }
}

declare module '@deepseek-ai/dsh-client-locale/client' {}
declare module '@deepseek-ai/dsh-client-ui-settings/client' {}

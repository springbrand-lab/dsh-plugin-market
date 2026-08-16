declare module '@deepseek-ai/dsh-client-runtime/client' {
  export interface ClientContext {
    slots: {
      inject(name: string, register: () => void | (() => void)): void
      register(
        options: { name: string; id: string; order?: number; label?: string | (() => string) },
        component: import('react').ComponentType,
      ): () => void
    }
  }
}

declare module '@deepseek-ai/dsh-client-ui-settings/client' {}

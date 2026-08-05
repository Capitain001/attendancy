import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client'

const CACHE_KEY = 'attendancy-rq-cache'

// Persister localStorage — disponible dans browser ET WebView Tauri.
// localStorage est synchrone et disponible sans package supplémentaire.
export const idbPersister: Persister = {
  persistClient(client: PersistedClient) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(client))
    } catch {
      // Quota dépassé — silencieux
    }
  },
  restoreClient() {
    try {
      const item = localStorage.getItem(CACHE_KEY)
      return item ? (JSON.parse(item) as PersistedClient) : undefined
    } catch {
      return undefined
    }
  },
  removeClient() {
    localStorage.removeItem(CACHE_KEY)
  },
}

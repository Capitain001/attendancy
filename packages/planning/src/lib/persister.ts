import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client'
import { get, set, del } from 'idb-keyval'

const CACHE_KEY = 'attendancy-rq-cache'

// IndexedDB via idb-keyval — async, pas de limite 5 MB, fonctionne dans
// browser ET WebView Tauri. Fallback silencieux si IndexedDB indisponible.
export const idbPersister: Persister = {
  async persistClient(client: PersistedClient) {
    try {
      await set(CACHE_KEY, client)
    } catch {
      // IndexedDB plein ou indisponible — silencieux
    }
  },
  async restoreClient() {
    try {
      return await get<PersistedClient>(CACHE_KEY)
    } catch {
      return undefined
    }
  },
  async removeClient() {
    try {
      await del(CACHE_KEY)
    } catch {
      // silencieux
    }
  },
}

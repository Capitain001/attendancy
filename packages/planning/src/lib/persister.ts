import { createAsyncStoragePersister } from '@tanstack/react-query-persist-client'
import { get, set, del } from 'idb-keyval'

// Persister IndexedDB — fonctionne dans browser ET WebView Tauri
export const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem:    (key) => get(key),
    setItem:    (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
})

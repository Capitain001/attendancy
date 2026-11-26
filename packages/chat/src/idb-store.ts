//packages\chat\src\idb-store.ts
// Entrée séparée : importe idb-keyval, donc à n'utiliser que côté navigateur/Tauri.
// Chaque store est une base IndexedDB à part : le queryPersister et
// clearLocalData() n'y touchent pas.
import { createStore, del, entries, get, set } from 'idb-keyval'
import type { KVStore } from './store'

export function idbStore<T>(dbName: string): KVStore<T> {
  const store = createStore(dbName, 'items')
  return {
    get: (k) => get<T>(k, store),
    set: (k, v) => set(k, v, store),
    del: (k) => del(k, store),
    entries: async () => (await entries<string, T>(store)).map(([k, v]) => [String(k), v]),
  }
}

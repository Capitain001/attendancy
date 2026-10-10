// apps\desktop\src\lib\cache\persister.ts
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { get, set, del } from 'idb-keyval'

const KEY = 'attendancy-query-cache'
const THROTTLE_MS = 1000

let pending: PersistedClient | undefined
let timer: ReturnType<typeof setTimeout> | undefined

function cancel() {
  pending = undefined
  if (timer) { clearTimeout(timer); timer = undefined }
}

function flush() {
  if (timer) { clearTimeout(timer); timer = undefined }
  if (!pending) return
  const client = pending
  pending = undefined
  void set(KEY, client)
}

// Android et iOS suspendent l'app sans prévenir : on écrit dès qu'elle passe en arrière-plan.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush()
})

// IndexedDB utilise le structured clone : les Date sont conservées telles quelles.
export const queryPersister: Persister = {
  persistClient: async (client) => {
    pending = client
    timer ??= setTimeout(flush, THROTTLE_MS)
  },
  restoreClient: () => get<PersistedClient>(KEY),
  removeClient: async () => {
    cancel()
    await del(KEY)
  },
}
import type { KVStore } from './store'
import type { OutboxItem } from './types'

export const bySentAt = (a: { sentAt: string; id: string }, b: { sentAt: string; id: string }) =>
  Date.parse(a.sentAt) - Date.parse(b.sentAt) || a.id.localeCompare(b.id)

export type Outbox = ReturnType<typeof createOutbox>

export function createOutbox({
  store,
  userId,
  crossTab = false,
}: {
  store: KVStore<OutboxItem>
  userId: string
  crossTab?: boolean
}) {
  const listeners = new Set<() => void>()
  const bc =
    crossTab && typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(`attendancy-outbox:${userId}`)
      : null
  bc?.addEventListener('message', () => listeners.forEach((l) => l()))

  const emit = () => {
    listeners.forEach((l) => l())
    bc?.postMessage(1)
  }

  // Toujours filtré par userId : un autre compte sur l'appareil ne voit ni ne
  // flush jamais les messages en attente du précédent.
  async function list(channelId?: string) {
    const all = (await store.entries())
      .map(([, v]) => v)
      .filter((i) => i.userId === userId && (!channelId || i.channelId === channelId))
    return all.sort(bySentAt)
  }

  async function add(item: Omit<OutboxItem, 'status' | 'userId'>) {
    const full: OutboxItem = { ...item, userId, status: 'pending' }
    await store.set(item.id, full)
    emit()
    return full
  }

  async function patch(id: string, change: Partial<OutboxItem>) {
    const cur = await store.get(id)
    if (!cur || cur.userId !== userId) return
    await store.set(id, { ...cur, ...change })
    emit()
  }

  async function remove(id: string) {
    const cur = await store.get(id)
    if (!cur || cur.userId !== userId) return
    await store.del(id)
    emit()
  }

  return {
    list,
    add,
    remove,
    markFailed: (id: string, error: string) => patch(id, { status: 'failed', error }),
    retry: (id: string) => patch(id, { status: 'pending', error: undefined }),
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    close: () => bc?.close(),
  }
}

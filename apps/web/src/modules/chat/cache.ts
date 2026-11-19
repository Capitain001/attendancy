import type { QueryClient } from '@tanstack/react-query'
import { messagesKey } from '@/hooks/data/messages/keys'

type CacheRecord = { id: string; [key: string]: unknown }
type CacheData<T extends CacheRecord> = { items: T[]; byId: Record<string, T> } | T[]

// modules/chat/cache.ts : même sémantique que applyPayload("INSERT") dans useEntity ({ items, byId })
export function insertMessage<T extends CacheRecord>(
  queryClient: QueryClient,
  channelId: string,
  record: T
) {
  queryClient.setQueryData<CacheData<T>>(messagesKey(channelId), (old) => {
    if (!old) return old
    const currentItems: T[] = Array.isArray(old) ? old : old.items || []
    const currentById: Record<string, T> = Array.isArray(old)
      ? old.reduce((acc, item) => ({ ...acc, [item.id]: item }), {} as Record<string, T>)
      : old.byId || {}

    const exists = !!currentById[record.id]
    const newItems = exists
      ? currentItems.map((item) => (item.id === record.id ? record : item))
      : [...currentItems, record]
    const newById: Record<string, T> = { ...currentById, [record.id]: record }

    return Array.isArray(old) ? newItems : { ...old, items: newItems, byId: newById }
  })
}

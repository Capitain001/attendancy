import type { ChatMessage, Envelope, OutboxItem, PersistedMessage } from './types'

// Priorité à l'id : serveur > pair (non vérifié) > en attente locale.
export function mergeMessages({
  persisted,
  inbox,
  outbox,
  userId,
  userName = null,
}: {
  persisted: PersistedMessage[]
  inbox: Envelope[]
  outbox: OutboxItem[]
  userId: string
  userName?: string | null
}) {
  const byId = new Map<string, ChatMessage>()

  for (const i of outbox) {
    byId.set(i.id, {
      id: i.id,
      channelId: i.channelId,
      authorId: userId,
      authorName: userName,
      content: i.content,
      parentId: i.parentId,
      createdAt: i.sentAt,
      status: i.status,
    })
  }
  for (const e of inbox) {
    byId.set(e.id, {
      id: e.id,
      channelId: e.channelId,
      authorId: e.authorId,
      authorName: e.authorName ?? null,
      content: e.content,
      parentId: e.parentId ?? null,
      createdAt: e.sentAt,
      status: 'unverified',
    })
  }
  for (const m of persisted) byId.set(m.id, { ...m, status: 'sent' })

  return [...byId.values()].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id),
  )
}

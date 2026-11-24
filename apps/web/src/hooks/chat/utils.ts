// src/hooks/chat/utils.ts
import { ANONYMOUS_NAME } from '@/hooks/chat/constants'
import type { RealtimeMessage } from '@/hooks/chat/use-realtime-chat'
import { getFullName } from '@/lib/utils'
import type { GetMessagesDto } from '@attendancy/types'
import { truncatePreview } from '@/services/message/utils'
import type { ReplyPreview } from './types'

export const mapMessages = (messages: GetMessagesDto = []): RealtimeMessage[] =>
  messages.map(({ id, content, parentId, createdAt, editedAt, user }) => ({
    id,
    content,
    parentId,
    createdAt: typeof createdAt === 'string' ? createdAt : createdAt.toISOString(),
    editedAt: editedAt ? new Date(editedAt).toISOString() : null,
    // Auteur supprimé (user null) ou sans nom : même repli que côté temps réel
    user: {
      id: user?.id ?? null,
      name: getFullName(user?.firstName, user?.lastName) ?? ANONYMOUS_NAME,
    },
  }))

// Instantanés serveur, indexés par id de parent. Les entrées créées de façon optimiste n'ont
// pas de `parent` : elles sont simplement ignorées.
export const mapReplySnapshots = (messages: GetMessagesDto = []) => {
  const snapshots = new Map<string, ReplyPreview>()
  for (const { parent } of messages) {
    if (!parent || snapshots.has(parent.id)) continue
    snapshots.set(parent.id, {
      id: parent.id,
      authorName: getFullName(parent.user?.firstName, parent.user?.lastName) ?? ANONYMOUS_NAME,
      content: parent.content, // déjà tronqué, et null si supprimé, par le serveur
      state: parent.deleted ? 'deleted' : 'available',
    })
  }
  return snapshots
}

export function resolveReplyTo(
  parentId: string | null,
  loadedById: ReadonlyMap<string, RealtimeMessage>, // AVANT filtre des suppressions, APRÈS éditions
  snapshots: ReadonlyMap<string, ReplyPreview>,
  deletedIds: ReadonlySet<string>,
): ReplyPreview | null {
  if (!parentId) return null
  const loaded = loadedById.get(parentId)
  const snapshot = snapshots.get(parentId)

  // Suppression connue : prime sur tout
  if (deletedIds.has(parentId)) {
    return {
      id: parentId,
      authorName: loaded?.user.name ?? snapshot?.authorName ?? null,
      content: null,
      state: 'deleted',
    }
  }
  // 1. Parent chargé : version la plus fraîche (éditions comprises)
  if (loaded) {
    return {
      id: parentId,
      authorName: loaded.user.name,
      content: truncatePreview(loaded.content),
      state: 'available',
    }
  }
  // 2. Instantané serveur (parent hors fenêtre, ou supprimé côté serveur)
  if (snapshot) return snapshot
  // 3. Rien
  return { id: parentId, authorName: null, content: null, state: 'unknown' }
}

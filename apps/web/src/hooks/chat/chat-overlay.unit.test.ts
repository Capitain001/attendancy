import { describe, expect, it } from 'vitest'
import type { RealtimeMessage } from '@/hooks/chat/use-realtime-chat'
import type { ChatMessage, OutboxEntry } from '@/hooks/chat/types'

// Fonction pure isolant la logique exacte de fusion et de surcouche de useChat.ts
function mergeChatMessages({
  persisted = [],
  realtimeMessages = [],
  outbox = {},
  channelId,
  userId,
  userName = 'Anonyme',
  patches = {},
  deletedIds = new Set<string>(),
}: {
  persisted?: RealtimeMessage[]
  realtimeMessages?: RealtimeMessage[]
  outbox?: Record<string, OutboxEntry>
  channelId: string
  userId?: string | null
  userName?: string
  patches?: Record<string, { content: string; editedAt: string }>
  deletedIds?: ReadonlySet<string>
}): ChatMessage[] {
  const pending: RealtimeMessage[] = Object.entries(outbox)
    .filter(([, entry]) => entry.channelId === channelId)
    .map(([id, entry]) => ({
      id,
      content: entry.content,
      parentId: entry.parentId,
      createdAt: entry.createdAt,
      editedAt: null,
      user: { id: userId ?? null, name: userName },
    }))

  // Priorité : persisté > temps réel > outbox
  const merged = new Map<string, RealtimeMessage>()
  for (const message of [...persisted, ...realtimeMessages, ...pending]) {
    if (!merged.has(message.id)) merged.set(message.id, message)
  }

  return [...merged.values()]
    .filter((message) => !deletedIds.has(message.id))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((message) => {
      const patch = patches[message.id]
      const current =
        patch && (!message.editedAt || message.editedAt < patch.editedAt)
          ? { ...message, content: patch.content, editedAt: patch.editedAt }
          : message

      return {
        ...current,
        isOwn: !!userId && current.user.id === userId,
        status: outbox[current.id]?.status ?? 'sent',
      }
    })
}

describe('chat-overlay (logique de fusion et surcouche de useChat)', () => {
  const channelId = 'channel-1'
  const userId = 'user-alice'

  it('masque les messages supprimés présents dans deletedIds (pierre tombale)', () => {
    const m1: RealtimeMessage = {
      id: 'msg-1',
      content: 'Message 1',
      parentId: null,
      createdAt: '2026-11-18T10:00:00.000Z',
      editedAt: null,
      user: { id: 'other', name: 'Bob' },
    }
    const m2: RealtimeMessage = {
      id: 'msg-2',
      content: 'Message 2',
      parentId: null,
      createdAt: '2026-11-18T10:01:00.000Z',
      editedAt: null,
      user: { id: 'other', name: 'Bob' },
    }

    const deletedIds = new Set(['msg-1'])

    const result = mergeChatMessages({
      persisted: [m1, m2],
      channelId,
      userId,
      deletedIds,
    })

    expect(result.length).toBe(1)
    expect(result[0].id).toBe('msg-2')
    expect(result.some((m) => m.id === 'msg-1')).toBe(false)
  })

  it('masque un message supprimé même s’il provient du temps réel ou de l’outbox', () => {
    const realtimeMsg: RealtimeMessage = {
      id: 'rt-1',
      content: 'Temps réel',
      parentId: null,
      createdAt: '2026-11-18T10:05:00.000Z',
      editedAt: null,
      user: { id: 'other', name: 'Bob' },
    }

    const result = mergeChatMessages({
      realtimeMessages: [realtimeMsg],
      channelId,
      userId,
      deletedIds: new Set(['rt-1']),
    })

    expect(result.length).toBe(0)
  })

  it('applique le patch d’édition si patch.editedAt > message.editedAt (LWW)', () => {
    const m1: RealtimeMessage = {
      id: 'msg-1',
      content: 'Texte initial',
      parentId: null,
      createdAt: '2026-11-18T10:00:00.000Z',
      editedAt: '2026-11-18T10:01:00.000Z',
      user: { id: 'other', name: 'Bob' },
    }

    const patches = {
      'msg-1': {
        content: 'Texte édité et validé',
        editedAt: '2026-11-18T10:02:00.000Z',
      },
    }

    const result = mergeChatMessages({
      persisted: [m1],
      channelId,
      userId,
      patches,
    })

    expect(result[0].content).toBe('Texte édité et validé')
    expect(result[0].editedAt).toBe('2026-11-18T10:02:00.000Z')
  })

  it('ignore un patch plus ancien que le editedAt du message (LWW départage)', () => {
    const m1: RealtimeMessage = {
      id: 'msg-1',
      content: 'Dernière version serveur',
      parentId: null,
      createdAt: '2026-11-18T10:00:00.000Z',
      editedAt: '2026-11-18T10:05:00.000Z',
      user: { id: 'other', name: 'Bob' },
    }

    // Patch reçu tardivement datant de 10:02:00
    const patches = {
      'msg-1': {
        content: 'Version antérieure périmée',
        editedAt: '2026-11-18T10:02:00.000Z',
      },
    }

    const result = mergeChatMessages({
      persisted: [m1],
      channelId,
      userId,
      patches,
    })

    expect(result[0].content).toBe('Dernière version serveur')
    expect(result[0].editedAt).toBe('2026-11-18T10:05:00.000Z')
  })

  it('respecte la priorité persisté > temps réel > outbox', () => {
    const id = 'msg-duplicate'
    const persisted: RealtimeMessage = {
      id,
      content: 'Contenu persisté (gagne)',
      parentId: null,
      createdAt: '2026-11-18T10:00:00.000Z',
      editedAt: null,
      user: { id: userId, name: 'Alice' },
    }
    const realtime: RealtimeMessage = {
      id,
      content: 'Contenu temps réel (perd)',
      parentId: null,
      createdAt: '2026-11-18T10:00:00.000Z',
      editedAt: null,
      user: { id: userId, name: 'Alice' },
    }
    const outbox: Record<string, OutboxEntry> = {
      [id]: {
        channelId,
        content: 'Contenu outbox (perd)',
        createdAt: '2026-11-18T10:00:00.000Z',
        parentId: null,
        status: 'sending',
      },
    }

    const result = mergeChatMessages({
      persisted: [persisted],
      realtimeMessages: [realtime],
      outbox,
      channelId,
      userId,
    })

    expect(result.length).toBe(1)
    expect(result[0].content).toBe('Contenu persisté (gagne)')
    expect(result[0].status).toBe('sending') // statut déduit de l'outbox
    expect(result[0].isOwn).toBe(true)
  })
})

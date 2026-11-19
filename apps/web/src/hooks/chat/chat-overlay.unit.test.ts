import { describe, expect, it } from 'vitest'
import type { RealtimeMessage } from '@/hooks/chat/use-realtime-chat'
import type { ChatMessage, MessageStatus } from '@/hooks/chat/types'
import type { Envelope, OutboxItem } from '@attendancy/chat'

// Fonction pure isolant la logique exacte de fusion 4-voies et de surcouche de useChat.ts
function mergeChatMessages({
  persisted = [],
  realtimeMessages = [],
  outboxItems = [],
  inboxEnvelopes = [],
  channelId,
  userId,
  userName = 'Anonyme',
  patches = {},
  deletedIds = new Set<string>(),
}: {
  persisted?: RealtimeMessage[]
  realtimeMessages?: RealtimeMessage[]
  outboxItems?: OutboxItem[]
  inboxEnvelopes?: Envelope[]
  channelId: string
  userId?: string | null
  userName?: string
  patches?: Record<string, { content: string; editedAt: string }>
  deletedIds?: ReadonlySet<string>
}): ChatMessage[] {
  const pending: RealtimeMessage[] = outboxItems
    .filter((item) => item.channelId === channelId)
    .map((item) => ({
      id: item.id,
      content: item.content,
      parentId: item.parentId,
      createdAt: item.createdAt,
      editedAt: null,
      user: { id: userId ?? null, name: userName },
    }))

  const unverified: RealtimeMessage[] = inboxEnvelopes
    .filter((env) => env.channelId === channelId)
    .map((env) => ({
      id: env.id,
      content: env.content,
      parentId: env.parentId ?? null,
      createdAt: env.createdAt,
      editedAt: null,
      user: { id: env.authorId, name: env.authorName || userName },
    }))

  // Priorité par id : persisté > temps réel > pair non vérifié > envoi local
  type Source = 'persisted' | 'realtime' | 'inbox' | 'outbox'
  const merged = new Map<string, RealtimeMessage>()
  const sources = new Map<string, Source>()
  const add = (list: RealtimeMessage[], source: Source) => {
    for (const message of list) {
      if (merged.has(message.id)) continue
      merged.set(message.id, message)
      sources.set(message.id, source)
    }
  }
  add(persisted, 'persisted')
  add(realtimeMessages, 'realtime')
  add(unverified, 'inbox')
  add(pending, 'outbox')
  const failedIds = new Set(outboxItems.filter((i) => i.status === 'failed').map((i) => i.id))

  return [...merged.values()]
    .filter((message) => !deletedIds.has(message.id))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((message) => {
      const patch = patches[message.id]
      const current =
        patch && (!message.editedAt || message.editedAt < patch.editedAt)
          ? { ...message, content: patch.content, editedAt: patch.editedAt }
          : message

      const source = sources.get(message.id)
      const status: MessageStatus =
        source === 'outbox'
          ? failedIds.has(message.id)
            ? 'failed'
            : 'sending'
          : source === 'inbox'
          ? 'unverified'
          : 'sent'

      return {
        ...current,
        isOwn: !!userId && current.user.id === userId,
        status,
        replyTo: null,
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

  it('respecte la priorité persisté > temps réel > inbox > outbox', () => {
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
    const outboxItems: OutboxItem[] = [
      {
        id,
        channelId,
        content: 'Contenu outbox (perd)',
        createdAt: '2026-11-18T10:00:00.000Z',
        parentId: null,
        userId,
        status: 'pending',
      },
    ]

    const result = mergeChatMessages({
      persisted: [persisted],
      realtimeMessages: [realtime],
      outboxItems,
      channelId,
      userId,
    })

    expect(result.length).toBe(1)
    expect(result[0].content).toBe('Contenu persisté (gagne)')
    expect(result[0].status).toBe('sent') // 'persisted' gagne
    expect(result[0].isOwn).toBe(true)
  })

  it('attribue le statut sending ou failed selon l’état dans outbox', () => {
    const outboxItems: OutboxItem[] = [
      {
        id: 'msg-sending',
        channelId,
        content: 'En cours',
        createdAt: '2026-11-18T10:00:00.000Z',
        parentId: null,
        userId,
        status: 'pending',
      },
      {
        id: 'msg-failed',
        channelId,
        content: 'En échec',
        createdAt: '2026-11-18T10:01:00.000Z',
        parentId: null,
        userId,
        status: 'failed',
      },
    ]

    const result = mergeChatMessages({
      outboxItems,
      channelId,
      userId,
    })

    expect(result.find((m) => m.id === 'msg-sending')?.status).toBe('sending')
    expect(result.find((m) => m.id === 'msg-failed')?.status).toBe('failed')
  })

  it('attribue le statut unverified pour les messages pairs reçus via inbox', () => {
    const inboxEnvelopes: Envelope[] = [
      {
        v:1,
        id: 'peer-msg',
        channelId,
        content: 'Message LAN',
        createdAt: '2026-11-18T10:00:00.000Z',
        parentId: null,
        authorId: 'user-bob',
        authorName: 'Bob',
      },
    ]

    const result = mergeChatMessages({
      inboxEnvelopes,
      channelId,
      userId,
    })

    expect(result.length).toBe(1)
    expect(result[0].id).toBe('peer-msg')
    expect(result[0].status).toBe('unverified')
    expect(result[0].isOwn).toBe(false)
  })
})

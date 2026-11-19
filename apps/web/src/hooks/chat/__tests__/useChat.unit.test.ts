import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PresenceUser } from '@/types'
import type { Envelope, OutboxItem } from '@attendancy/chat'

// --- Mock React hooks pour environnement Node ---
let stateIndex = 0
let states: any[] = []
let setters: Array<(next: any) => void> = []

function resetHookState() {
  stateIndex = 0
  states = []
  setters = []
}

function runHook<T>(hookFn: () => T): T {
  stateIndex = 0
  return hookFn()
}

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: vi.fn((initial: any) => {
      const idx = stateIndex++
      if (states.length <= idx) {
        const val = typeof initial === 'function' ? initial() : initial
        states.push(val)
        setters.push((next: any) => {
          states[idx] = typeof next === 'function' ? next(states[idx]) : next
        })
      }
      return [states[idx], setters[idx]]
    }),
    useMemo: vi.fn((fn: () => any) => fn()),
    useCallback: vi.fn((fn: (...args: any[]) => any) => fn),
    useEffect: vi.fn((fn: () => any) => {
      fn()
    }),
  }
})

// --- Mocks des modules dépendants ---
const {
  mockEngine,
  mockSync,
  mockChatSyncState,
  mockRealtimeChat,
  mockMessages,
  mockRegisterRealtimeSender,
} = vi.hoisted(() => {
  const engine = {
    send: vi.fn().mockResolvedValue(undefined),
    retry: vi.fn().mockResolvedValue(undefined),
    discard: vi.fn().mockResolvedValue(undefined),
  }
  const sync = {
    engine,
    outbox: { list: vi.fn() },
    inbox: { list: vi.fn(), confirm: vi.fn().mockResolvedValue(undefined) },
    version: 0,
    confirm: vi.fn().mockResolvedValue(undefined),
    connectLan: vi.fn(),
    disconnectLan: vi.fn(),
  }
  return {
    mockEngine: engine,
    mockSync: sync,
    mockChatSyncState: {
      outbox: [] as OutboxItem[],
      inbox: [] as Envelope[],
    },
    mockRealtimeChat: {
      messages: [],
      patches: {},
      deletedIds: new Set<string>(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      publishEdit: vi.fn().mockResolvedValue(undefined),
      publishDelete: vi.fn().mockResolvedValue(undefined),
      isConnected: true,
      reconnectCount: 0,
      connectedUsers: {},
      typingIds: new Set<string>(),
      notifyTyping: vi.fn(),
    },
    mockMessages: {
      data: { items: [], byId: {} },
      update: vi.fn().mockResolvedValue({ id: 'm1', content: 'edited', editedAt: new Date().toISOString() }),
      delete: vi.fn().mockResolvedValue(true),
      refetch: vi.fn().mockResolvedValue(undefined),
      loading: false,
      hasMore: false,
      loadOlder: vi.fn(),
      loadUntil: vi.fn(),
      isLoadingOlder: false,
    },
    mockRegisterRealtimeSender: vi.fn().mockReturnValue(() => {}),
  }
})

vi.mock('@/modules/chat', () => ({
  useChatSync: () => mockSync,
  useChatSyncState: () => mockChatSyncState,
  registerRealtimeSender: mockRegisterRealtimeSender,
}))

vi.mock('@/hooks/data/messages/useMessages', () => ({
  useMessages: () => mockMessages,
}))

vi.mock('@/hooks/chat/use-realtime-chat', () => ({
  useRealtimeChat: () => mockRealtimeChat,
}))

vi.mock('@/hooks/chat/useChannelMute', () => ({
  useChannelMute: () => ({ isMuted: false, toggleMute: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn() },
}))

import { useChat } from '../useChat'

describe('useChat (avec moteur de synchronisation déporté)', () => {
  const channelId = 'channel-test-1'
  const user: PresenceUser = { id: 'user-alice', name: 'Alice' }

  beforeEach(() => {
    vi.clearAllMocks()
    resetHookState()
    mockChatSyncState.outbox = []
    mockChatSyncState.inbox = []
    mockRealtimeChat.isConnected = true
    mockMessages.data = { items: [], byId: {} }
  })

  describe('Envoi de message (sendMessage)', () => {
    it('délègue l’envoi à sync.engine.send avec channelId, content et replyToId', async () => {
      let chat = runHook(() => useChat({ channelId, user }))

      // Met à jour le message
      chat.setNewMessage('Bonjour à tous')
      chat = runHook(() => useChat({ channelId, user }))
      expect(chat.newMessage).toBe('Bonjour à tous')

      // Envoie le formulaire
      const preventDefault = vi.fn()
      await chat.sendMessage({ preventDefault } as unknown as React.FormEvent)

      expect(preventDefault).toHaveBeenCalledOnce()
      expect(mockEngine.send).toHaveBeenCalledWith({
        channelId,
        content: 'Bonjour à tous',
        parentId: null,
      })

      // Le texte est vidé et notifyTyping est désactivé
      chat = runHook(() => useChat({ channelId, user }))
      expect(chat.newMessage).toBe('')
      expect(mockRealtimeChat.notifyTyping).toHaveBeenCalledWith(false)
    })

    it('fonctionne même hors ligne (isConnected: false)', async () => {
      mockRealtimeChat.isConnected = false
      let chat = runHook(() => useChat({ channelId, user }))

      chat.setNewMessage('Message hors-ligne')
      chat = runHook(() => useChat({ channelId, user }))

      await chat.sendMessage({ preventDefault: vi.fn() } as unknown as React.FormEvent)

      expect(mockEngine.send).toHaveBeenCalledWith({
        channelId,
        content: 'Message hors-ligne',
        parentId: null,
      })
    })

    it('ignore un message vide ou composé d’espaces', async () => {
      const chat = runHook(() => useChat({ channelId, user }))
      chat.setNewMessage('   ')

      await chat.sendMessage({ preventDefault: vi.fn() } as unknown as React.FormEvent)

      expect(mockEngine.send).not.toHaveBeenCalled()
    })
  })

  describe('Réessai et abandon (retryMessage & discardMessage)', () => {
    it('délègue retryMessage à sync.engine.retry sans modification', async () => {
      const chat = runHook(() => useChat({ channelId, user }))

      await chat.retryMessage('msg-failed-1')

      expect(mockEngine.retry).toHaveBeenCalledWith('msg-failed-1', undefined)
    })

    it('délègue retryMessage avec withoutReply: true à sync.engine.retry avec { parentId: null }', async () => {
      const chat = runHook(() => useChat({ channelId, user }))

      await chat.retryMessage('msg-failed-parent', { withoutReply: true })

      expect(mockEngine.retry).toHaveBeenCalledWith('msg-failed-parent', { parentId: null })
    })

    it('délègue discardMessage à sync.engine.discard', async () => {
      const chat = runHook(() => useChat({ channelId, user }))

      await chat.discardMessage('msg-abandon')

      expect(mockEngine.discard).toHaveBeenCalledWith('msg-abandon')
    })
  })

  describe('Citations et réponses (startReply & cancelReply)', () => {
    it('autorise la citation d’un message confirmé (sent)', () => {
      mockMessages.data = {
        items: [
          {
            id: 'msg-sent',
            channelId,
            content: 'Message déjà en base',
            createdAt: new Date(),
            updatedAt: new Date(),
            editedAt: null,
            parentId: null,
            parent: null,
            user: { id: 'u2', firstName: 'Bob', lastName: null, avatar_url: null },
          },
        ] as any,
        byId: {},
      }

      let chat = runHook(() => useChat({ channelId, user }))
      chat.startReply('msg-sent')
      chat = runHook(() => useChat({ channelId, user }))

      expect(chat.replyingTo).toEqual({
        id: 'msg-sent',
        authorName: 'Bob',
        content: 'Message déjà en base',
        state: 'available',
      })
    })

    it('autorise la citation d’un message non vérifié de pair (unverified)', () => {
      mockChatSyncState.inbox = [
        {
          v: 1,
          id: 'peer-msg',
          channelId,
          content: 'Message LAN pair',
          createdAt: '2026-11-19T10:00:00.000Z',
          parentId: null,
          authorId: 'u-peer',
          authorName: 'Pair LAN',
        },
      ]

      let chat = runHook(() => useChat({ channelId, user }))
      expect(chat.messages.find((m) => m.id === 'peer-msg')?.status).toBe('unverified')

      chat.startReply('peer-msg')
      chat = runHook(() => useChat({ channelId, user }))

      expect(chat.replyingTo?.id).toBe('peer-msg')
      expect(chat.replyingTo?.content).toBe('Message LAN pair')
    })

    it('autorise la citation d’un message en cours d’envoi (sending)', () => {
      mockChatSyncState.outbox = [
        {
          id: 'outbox-msg',
          channelId,
          content: 'Mon message en vol',
          createdAt: '2026-11-19T10:00:00.000Z',
          parentId: null,
          userId: user.id,
          status: 'pending',
        },
      ]

      let chat = runHook(() => useChat({ channelId, user }))
      expect(chat.messages.find((m) => m.id === 'outbox-msg')?.status).toBe('sending')

      chat.startReply('outbox-msg')
      chat = runHook(() => useChat({ channelId, user }))

      expect(chat.replyingTo?.id).toBe('outbox-msg')
    })

    it('refuse la citation d’un message en échec (failed)', () => {
      mockChatSyncState.outbox = [
        {
          id: 'outbox-failed',
          channelId,
          content: 'Message refusé par le serveur',
          createdAt: '2026-11-19T10:00:00.000Z',
          parentId: null,
          userId: user.id,
          status: 'failed',
        },
      ]

      let chat = runHook(() => useChat({ channelId, user }))
      expect(chat.messages.find((m) => m.id === 'outbox-failed')?.status).toBe('failed')

      chat.startReply('outbox-failed')
      chat = runHook(() => useChat({ channelId, user }))

      expect(chat.replyingTo).toBeNull()
    })

    it('cancelReply réinitialise replyingTo', () => {
      mockChatSyncState.outbox = [
        {
          id: 'outbox-msg',
          channelId,
          content: 'Mon message',
          createdAt: '2026-11-19T10:00:00.000Z',
          parentId: null,
          userId: user.id,
          status: 'pending',
        },
      ]

      let chat = runHook(() => useChat({ channelId, user }))
      chat.startReply('outbox-msg')
      chat = runHook(() => useChat({ channelId, user }))
      expect(chat.replyingTo).not.toBeNull()

      chat.cancelReply()
      chat = runHook(() => useChat({ channelId, user }))
      expect(chat.replyingTo).toBeNull()
    })
  })

  describe('Auto-confirmation de l’inbox et enregistrement', () => {
    it('enregistre le diffuseur temps réel pour le canal donné', () => {
      runHook(() => useChat({ channelId, user }))
      expect(mockRegisterRealtimeSender).toHaveBeenCalledWith(
        channelId,
        mockRealtimeChat.sendMessage
      )
    })

    it('confirme les messages reçus de l’inbox dès qu’ils sont persistés sur le serveur', () => {
      mockChatSyncState.inbox = [
        {
          v: 1,
          id: 'msg-confirmed-later',
          channelId,
          content: 'Texte',
          createdAt: '2026-11-19T10:00:00.000Z',
          parentId: null,
          authorId: 'u-peer',
          authorName: 'Pair',
        },
      ]
      mockMessages.data = {
        items: [
          {
            id: 'msg-confirmed-later',
            createdAt: new Date(),
            content: 'Texte',
            channelId,
            parentId: null,
            user: { id: 'u-peer', firstName: 'Pair' },
          },
        ] as any,
        byId: {},
      }

      runHook(() => useChat({ channelId, user }))

      expect(mockSync.confirm).toHaveBeenCalledWith(['msg-confirmed-later'])
    })
  })

  describe('Édition et suppression', () => {
    it('editMessage met à jour le message et publie l’édition', async () => {
      const chat = runHook(() => useChat({ channelId, user }))

      const success = await chat.editMessage('m1', 'Texte corrigé')

      expect(success).toBe(true)
      expect(mockMessages.update).toHaveBeenCalledWith({ id: 'm1', data: { content: 'Texte corrigé' } })
      expect(mockRealtimeChat.publishEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'm1',
          content: 'edited',
        })
      )
    })

    it('deleteMessage supprime le message et publie la suppression', async () => {
      const chat = runHook(() => useChat({ channelId, user }))

      const success = await chat.deleteMessage('m1')

      expect(success).toBe(true)
      expect(mockMessages.delete).toHaveBeenCalledWith('m1')
      expect(mockRealtimeChat.publishDelete).toHaveBeenCalledWith('m1')
    })
  })
})

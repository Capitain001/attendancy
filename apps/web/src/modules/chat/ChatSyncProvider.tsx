'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  createChatSync,
  createInbox,
  createLanTransport,
  createOutbox,
  type ChatSync,
  type Envelope,
  type Inbox,
  type Outbox,
  type OutboxItem,
  type Pairing,
  type SendResult,
} from '@attendancy/chat'
import { idbStore } from '@attendancy/chat/idb'
import { createMessageAction } from '@/services/message/actions'
import { MESSAGE } from '@/services/message/policy'
import { ERROR_CODES } from '@/config'
import { notifyChannelMembersAction } from '@/services/notification/domains/chat'
import { messageEntityPatch, mapMessageUser } from '@/hooks/data/messages/utils'
import type { PresenceUser } from '@/types'
import { insertMessage } from './cache'
import { broadcastSent } from './realtime-registry'

type Ctx = {
  engine: ChatSync
  outbox: Outbox
  inbox: Inbox
  version: number // incrémenté à chaque changement d'outbox ou d'inbox
  confirm: (ids: string[]) => Promise<void>
  connectLan: (p: Pairing) => void
  disconnectLan: () => void
}

const ChatSyncContext = createContext<Ctx | null>(null)
export const useChatSync = () => useContext(ChatSyncContext)

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ])

// Codes d'erreur transitoires : le message reste pending et sera rejoué automatiquement
const RETRYABLE_CODES = new Set<string>([
  ERROR_CODES.UNAUTHORIZED, // token expiré après une session hors-ligne prolongée
  ERROR_CODES.SERVER, // panne réseau/serveur temporaire
  ...(MESSAGE.RETRYABLE_CODES as readonly string[]), // ex: PARENT_MISSING
])

export function ChatSyncProvider({
  user,
  channelIds,
  children,
}: {
  user: PresenceUser
  channelIds: string[]
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const [version, setVersion] = useState(0)
  const [ctx, setCtx] = useState<Omit<Ctx, 'version'> | null>(null)
  const userRef = useRef(user)
  const channelsRef = useRef(channelIds)
  useEffect(() => {
    userRef.current = user
    channelsRef.current = channelIds
  })

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    // Inbox propre à chaque compte : les messages de pairs ne se retrouvent pas chez le suivant
    const inbox = createInbox({
      store: idbStore<{ env: Envelope; receivedAt: string }>(
        `attendancy-chat-inbox:${user.id}`
      ),
    })
    const outbox = createOutbox({
      store: idbStore<OutboxItem>('attendancy-chat-outbox'),
      userId: user.id,
      crossTab: true,
    })

    const sendToServer = async (item: OutboxItem): Promise<SendResult> => {
      const vars = {
        id: item.id,
        channelId: item.channelId,
        content: item.content,
        parentId: item.parentId,
        createdAt: item.createdAt,
      }
      // Exception (réseau KO, délai dépassé) = reste pending. Un renvoi est idempotent côté serveur.
      const res = await withTimeout(createMessageAction(vars), 20_000)
      if (!('data' in res) || !res.data) {
        const code = 'code' in res && res.code ? String(res.code) : ''
        return {
          error: ('error' in res && res.error) || 'Refusé',
          retryable: RETRYABLE_CODES.has(code),
        }
      }
      // Cache AVANT de rendre la main : le moteur vide l'outbox juste après, sans clignotement
      const { created: _created, ...server } = res.data
      insertMessage(queryClient, item.channelId, {
        ...(mapMessageUser(userRef.current) ?? {}),
        ...messageEntityPatch(vars),
        ...server,
      } as { id: string })
      return { data: res.data }
    }

    const engine = createChatSync({
      userId: user.id,
      userName: user.name ?? null,
      outbox,
      inbox,
      sendToServer,
      onChange: bump,
      acceptsChannel: (id) => channelsRef.current.includes(id),
      // Une seule fois par message retiré de l'outbox : diffusion temps réel avec la date officielle, puis notification push.
      // S'exécute à chaque onSent (y compris en cas de rejeu avec created: false si l'ack précédent s'était perdu).
      onSent: (item, data) => {
        const { createdAt } = (data ?? {}) as { createdAt?: string | Date }
        const createdAtIso = createdAt ? new Date(createdAt).toISOString() : item.createdAt
        void broadcastSent(item.channelId, {
          id: item.id,
          content: item.content,
          parentId: item.parentId,
          createdAt: createdAtIso,
        })?.catch(() => {})
        notifyChannelMembersAction({
          channelId: item.channelId,
          messageId: item.id,
        }).catch(() => {})
      },
    })

    let detachLan: (() => void) | undefined
    const connectLan = (p: Pairing) => {
      detachLan?.()
      detachLan = engine.attach(
        createLanTransport({
          url: p.url,
          token: p.token,
          userId: user.id,
          name: userRef.current.name,
          channels: channelsRef.current,
          known: () => inbox.knownIds(channelsRef.current),
        })
      )
    }

    const offOutbox = outbox.subscribe(bump)
    const onOnline = () => void engine.flush()
    window.addEventListener('online', onOnline)
    engine.start() // envoie aussi ce qui attendait avant la fermeture de l'app

    setCtx({
      engine,
      outbox,
      inbox,
      connectLan,
      disconnectLan: () => {
        detachLan?.()
        detachLan = undefined
      },
      confirm: async (ids) => {
        await inbox.confirm(ids)
        bump()
      },
    })
    return () => {
      window.removeEventListener('online', onOnline)
      offOutbox()
      detachLan?.()
      engine.stop()
      outbox.close()
      setCtx(null)
    }
  }, [user.id, queryClient]) // userRef/channelsRef : valeurs courantes, sans recréer le moteur

  return (
    <ChatSyncContext.Provider value={ctx ? { ...ctx, version } : null}>
      {children}
    </ChatSyncContext.Provider>
  )
}

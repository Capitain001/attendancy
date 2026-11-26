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
  decodePairing,
  encodePairing,
  type ChatSync,
  type Envelope,
  type Inbox,
  type Outbox,
  type OutboxItem,
  type Pairing,
  type SendResult,
  type TransportStatus,
} from '@attendancy/chat'
import { idbStore } from '@attendancy/chat/idb'
import { createMessageAction } from '@/services/message/actions'
import { MESSAGE } from '@/services/message/policy'
import { ERROR_CODES } from '@/config/constants'
import { notifyChannelMembersAction } from '@/services/notification'
import { messageEntityPatch, mapMessageUser } from '@/hooks/data/messages/utils'
import type { PresenceUser } from '@attendancy/user'
import { insertMessage } from './cache'
import { broadcastSent } from './realtime-registry'

const LAN_KEY = 'attendancy-chat-lan'
export type LanState = { status: TransportStatus; failure: string | null; pairing: Pairing | null }
const LAN_IDLE: LanState = { status: 'idle', failure: null, pairing: null }

type Ctx = {
  engine: ChatSync
  outbox: Outbox
  inbox: Inbox
  version: number // incrémenté à chaque changement d'outbox ou d'inbox
  lan: LanState
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
  const [lan, setLan] = useState<LanState>(LAN_IDLE)
  const [ctx, setCtx] = useState<Omit<Ctx, 'version' | 'lan'> | null>(null)
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

    const forget = () => {
      try {
        sessionStorage.removeItem(LAN_KEY)
      } catch {
        /* indisponible */
      }
    }

    let detachLan: (() => void) | undefined
    const connectLan = (p: Pairing) => {
      detachLan?.()
      const transport = createLanTransport({
        url: p.url,
        token: p.token,
        userId: user.id,
        name: userRef.current.name,
        channels: channelsRef.current,
        known: () => inbox.knownIds(channelsRef.current),
      })
      // Abonné AVANT attach : le premier « connecting » n'est pas manqué
      const offStatus = transport.onStatus((status) => {
        const failure = transport.failure?.() ?? null
        if (failure) forget() // un code refusé ne doit pas être rejoué au rechargement
        setLan({ status, failure, pairing: p })
      })
      const detach = engine.attach(transport)
      detachLan = () => {
        offStatus()
        detach()
      }
      setLan({ status: transport.status(), failure: null, pairing: p })
      try {
        sessionStorage.setItem(LAN_KEY, encodePairing(p))
      } catch {
        /* indisponible */
      }
    }

    const disconnectLan = () => {
      detachLan?.()
      detachLan = undefined
      forget()
      setLan(LAN_IDLE)
    }

    const offOutbox = outbox.subscribe(bump)
    const onOnline = () => void engine.flush()
    window.addEventListener('online', onOnline)
    engine.start() // envoie aussi ce qui attendait avant la fermeture de l'app

    // Reprise après rechargement. decodePairing revalide format et hôte local.
    try {
      const saved = sessionStorage.getItem(LAN_KEY)
      const pairing = saved ? decodePairing(saved) : null
      if (pairing) connectLan(pairing)
    } catch {
      /* rien à reprendre */
    }

    setCtx({
      engine,
      outbox,
      inbox,
      connectLan,
      disconnectLan,
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
      setLan(LAN_IDLE)
      setCtx(null)
    }
  }, [user.id, queryClient]) // userRef/channelsRef : valeurs courantes, sans recréer le moteur

  return (
    <ChatSyncContext.Provider value={ctx ? { ...ctx, version, lan } : null}>
      {children}
    </ChatSyncContext.Provider>
  )
}

//apps\web\src\modules\chat\ChatSyncProvider.tsx
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
  type InboxRecord,
  type Outbox,
  type OutboxItem,
  type Pairing,
  type SendResult,
  type TransportStatus,
  type WebSocketCtor,
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
export type LanState = {
  status: TransportStatus
  failure: string | null
  pairing: Pairing | null
  omitted: number // messages plus anciens non reçus au dernier welcome (0 = historique complet)
}
const LAN_IDLE: LanState = { status: 'idle', failure: null, pairing: null, omitted: 0 }

type SavedLan = { link: string; channels?: string[] }
const MAX_SAVED_CHANNELS = 64

function saveLan(p: Pairing, channels: string[] | null) {
  try {
    const value: SavedLan = { link: encodePairing(p), ...(channels ? { channels } : {}) }
    sessionStorage.setItem(LAN_KEY, JSON.stringify(value))
  } catch {
    /* indisponible */
  }
}

function loadLan(): { pairing: Pairing; channels: string[] | null } | null {
  try {
    const raw = sessionStorage.getItem(LAN_KEY)
    if (!raw) return null
    let link = raw // ancien format : le lien seul
    let channels: string[] | null = null
    if (raw.startsWith('{')) {
      const saved = JSON.parse(raw) as Partial<SavedLan>
      link = String(saved.link ?? '')
      if (Array.isArray(saved.channels)) {
        channels = saved.channels.filter((c): c is string => typeof c === 'string').slice(0, MAX_SAVED_CHANNELS)
      }
    }
    const pairing = decodePairing(link) // revalide format et hôte local
    return pairing ? { pairing, channels: channels?.length ? channels : null } : null
  } catch {
    return null
  }
}

type Ctx = {
  engine: ChatSync
  outbox: Outbox
  inbox: Inbox
  version: number // incrémenté à chaque changement d'outbox ou d'inbox
  lan: LanState
  confirm: (ids: string[]) => Promise<void>
  connectLan: (p: Pairing, opts?: { channels?: string[] }) => void
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
  webSocketImpl,
  children,
}: {
  user: PresenceUser
  channelIds: string[]
  // Client WebSocket du LAN. Absent = celui du navigateur. L'app Tauri passe l'adaptateur du
  // plugin : le WebSocket du navigateur n'est pas fiable pour ws:// vers un appareil local.
  webSocketImpl?: WebSocketCtor
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const [version, setVersion] = useState(0)
  const [lan, setLan] = useState<LanState>(LAN_IDLE)
  const [ctx, setCtx] = useState<Omit<Ctx, 'version' | 'lan'> | null>(null)
  const userRef = useRef(user)
  const channelsRef = useRef(channelIds)
  const webSocketRef = useRef(webSocketImpl)
  const resumeRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    userRef.current = user
    channelsRef.current = channelIds
    webSocketRef.current = webSocketImpl
  })

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    // Inbox propre à chaque compte : les messages de pairs ne se retrouvent pas chez le suivant
    const inbox = createInbox({
      store: idbStore<InboxRecord>(
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

    // Source unique des canaux actifs : hello, known et acceptsChannel. Les canaux imposés par
    // connectLan (profil métier) priment sur la liste du provider, utilisée en repli.
    let imposed: string[] | null = null
    const activeChannels = () => imposed ?? channelsRef.current

    const engine = createChatSync({
      userId: user.id,
      userName: user.name ?? null,
      outbox,
      inbox,
      sendToServer,
      onChange: bump,
      acceptsChannel: (id) => activeChannels().includes(id),
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
    const connectLan = (p: Pairing, opts?: { channels?: string[] }) => {
      detachLan?.()
      detachLan = undefined // sans cela, resume() croirait une séance encore active
      imposed = opts?.channels?.length ? [...opts.channels] : null

      // Même garde que resume() : sans canal, le relais refuserait le hello (not_member, définitif)
      // et la séance serait effacée à tort. On la mémorise : resume() la reprendra à l'arrivée de la liste.
      const channels = activeChannels()
      if (!channels.length) {
        saveLan(p, imposed)
        setLan({ status: 'closed', failure: 'no_channels', pairing: p, omitted: 0 })
        return
      }

      // Sauvegardée AVANT attach : un refus immédiat (`unsupported`) appelle forget() pendant
      // attach, et ce forget() doit avoir le dernier mot.
      saveLan(p, imposed)

      const transport = createLanTransport({
        url: p.url,
        token: p.token,
        userId: user.id,
        name: userRef.current.name,
        channels,
        known: () => inbox.knownIds(activeChannels()),
        WebSocketImpl: webSocketRef.current,
      })
      // Abonné AVANT attach : le premier « connecting » n'est pas manqué
      const offStatus = transport.onStatus((status) => {
        const failure = transport.failure?.() ?? null
        if (failure) {
          forget() // un code refusé ne doit pas être rejoué au rechargement
          imposed = null // la séance est morte : les canaux imposés ne filtrent plus rien
        }
        setLan({ status, failure, pairing: p, omitted: transport.omitted?.() ?? 0 })
      })
      const detach = engine.attach(transport)
      detachLan = () => {
        offStatus()
        detach()
      }
      // État réel du transport (un refus synchrone a déjà posé sa cause), jamais écrasé par du neuf
      setLan({
        status: transport.status(),
        failure: transport.failure?.() ?? null,
        pairing: p,
        omitted: transport.omitted?.() ?? 0,
      })
    }

    const disconnectLan = () => {
      detachLan?.()
      detachLan = undefined
      imposed = null
      forget()
      setLan(LAN_IDLE)
    }

    const offOutbox = outbox.subscribe(bump)
    const onOnline = () => void engine.flush()
    window.addEventListener('online', onOnline)
    engine.start() // envoie aussi ce qui attendait avant la fermeture de l'app

    // Reprise après rechargement. Sans aucun canal (démarrage à froid, liste pas encore chargée),
    // le relais refuserait le hello (not_member, définitif) : on attend que la liste arrive.
    const resume = () => {
      if (detachLan) return
      const saved = loadLan()
      if (!saved || !(saved.channels ?? channelsRef.current).length) return
      connectLan(saved.pairing, saved.channels ? { channels: saved.channels } : undefined)
    }
    resumeRef.current = resume
    resume()

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
      resumeRef.current = null
      window.removeEventListener('online', onOnline)
      offOutbox()
      detachLan?.()
      engine.stop()
      outbox.close()
      setLan(LAN_IDLE)
      setCtx(null)
    }
  }, [user.id, queryClient]) // userRef/channelsRef : valeurs courantes, sans recréer le moteur

  // La liste des canaux arrive après le montage : reprise d'une séance locale en attente
  useEffect(() => {
    resumeRef.current?.()
  }, [channelIds.length])

  return (
    <ChatSyncContext.Provider value={ctx ? { ...ctx, version, lan } : null}>
      {children}
    </ChatSyncContext.Provider>
  )
}

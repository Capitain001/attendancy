 je confirme les points 1, 3 et 4. Le point 5 reste réel mais sans effet, et j'ai trouvé un défaut de plus.

**Point 1 : confirmé.** `send` de `lan-transport.ts` rejette bien la promesse avec `Error(reason)` sur un `reject` avec id. Le `catch { return }` de `pushTo` coupe donc la boucle au premier `not_member`. Je corrige deux choses :
- `pushTo` ne s'arrête plus que sur une erreur de connexion (`closed`, `stopped`, `not_connected`, `ack_timeout`, `rate_limited`). `rate_limited` en fait partie : le transport a déjà épuisé ses 5 renvois, insister ne ferait qu'aggraver.
- `pushTo` filtre sur `acceptsChannel`, qui est exactement la liste envoyée dans le `hello`. Un message hors de cette liste ne part plus.

**Point 3 : confirmé.** `connectLan` ouvre la socket avec `channels: []`, le relais répond `not_member` (fatal), puis `forget()` efface la séance. Désormais, sans canal, la séance est mémorisée et l'état passe à `failure: 'no_channels'`. `resume()` (déclenché par `channelIds.length`) se connecte dès que la liste arrive. Il faudra ajouter un libellé pour `no_channels` dans `LanPanel`.

**Point 4 : confirmé, avec un défaut en plus.** Dans le cas `unsupported`, `forget()` s'exécute pendant `attach`, puis `saveLan` re-sauvegarde la séance refusée. J'ai donc déplacé `saveLan` avant `attach`, et le dernier `setLan` lit l'état réel du transport.

**Point 5 : confirmé, mineur.** Sur refus fatal, `imposed` est remis à `null`. Je laisse le transport attaché : `send` filtre déjà sur `connected`, et le détacher depuis son propre callback est fragile, car `detachLan` n'est pas encore assigné dans le cas synchrone.

## `engine.ts`

```ts
///packages\chat\src\engine.ts
import type { Inbox } from './inbox'
import type { Outbox } from './outbox'
import type { Envelope, OutboxItem, SendResult } from './types'
import { MAX_BACKDATE_MS, MAX_CONTENT_LENGTH } from './limits'

export type TransportStatus = 'idle' | 'connecting' | 'connected' | 'closed'

// Un transport = un moyen de joindre des pairs sans serveur (hub LAN, BLE...).
// Même enveloppe pour tous : seul le transport change.
export interface ChatTransport {
  name: string
  start(): void
  stop(): void
  status(): TransportStatus
  failure?(): string | null
  // Messages plus anciens que le relais n'a pas pu joindre au dernier `welcome` (0 = historique complet)
  omitted?(): number
  send(env: Envelope): Promise<void>
  onReceive(cb: (env: Envelope) => void): () => void
  onStatus(cb: (s: TransportStatus) => void): () => void
}

export type ChatSyncDeps = {
  userId: string
  userName?: string | null
  outbox: Outbox
  inbox: Inbox
  // Lève une exception si le réseau est KO (le message reste pending).
  // Retourne { error } pour un refus définitif (le message passe en failed).
  sendToServer: (item: OutboxItem) => Promise<SendResult>
  probe?: () => Promise<boolean>
  transports?: ChatTransport[]
  now?: () => Date
  newId?: () => string
  onChange?: () => void
  flushIntervalMs?: number
  sendTimeoutMs?: number
  // Appelé une fois par message confirmé par le serveur, après retrait de l'outbox.
  // C'est ici que l'app diffuse en temps réel et notifie. Best-effort : une erreur est ignorée.
  onSent?: (item: OutboxItem, data: unknown) => void | Promise<void>
  // Canaux acceptés depuis les pairs ET envoyés aux pairs (c'est la liste du `hello`).
  // Sans lui, tout canal est accepté : à fournir.
  acceptsChannel?: (channelId: string) => boolean
}

export type ChatSync = ReturnType<typeof createChatSync>

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUuid = (x: unknown): x is string => typeof x === 'string' && UUID.test(x)

// Erreurs d'un transport qui touchent la CONNEXION : la suite de la file échouerait de même,
// inutile d'insister. `rate_limited` : le transport a déjà épuisé ses renvois.
// Toute autre erreur (not_member, bad_content, channel_limit...) ne concerne que CE message :
// on passe au suivant.
const CONNECTION_ERRORS = new Set(['closed', 'stopped', 'not_connected', 'ack_timeout', 'rate_limited'])

export function createChatSync(deps: ChatSyncDeps) {
  const {
    userId,
    userName = null,
    outbox,
    inbox,
    sendToServer,
    probe,
    now = () => new Date(),
    newId = () => crypto.randomUUID(),
    onChange,
    flushIntervalMs = 15_000,
    sendTimeoutMs = 20_000,
    onSent,
    acceptsChannel,
  } = deps

  const transports = [...(deps.transports ?? [])]
  let started = false
  let timer: ReturnType<typeof setInterval> | undefined
  const unsubs: (() => void)[] = []

  const toEnvelope = (i: OutboxItem): Envelope => ({
    v: 1,
    id: i.id,
    channelId: i.channelId,
    authorId: userId,
    authorName: userName,
    content: i.content,
    parentId: i.parentId,
    createdAt: i.createdAt,
  })

  async function pushTo(t: ChatTransport, items: OutboxItem[]) {
    for (const item of items) {
      // Hors des canaux annoncés au pair : il le refuserait (not_member), inutile de l'envoyer
      if (acceptsChannel && !acceptsChannel(item.channelId)) continue
      try {
        await t.send(toEnvelope(item))
      } catch (e) {
        const reason = e instanceof Error ? e.message : ''
        // Erreur inconnue : par prudence on s'arrête, comme pour une erreur de connexion
        if (!reason || CONNECTION_ERRORS.has(reason)) return
      }
    }
  }

  async function send({
    channelId,
    content,
    parentId = null,
  }: {
    channelId: string
    content: string
    parentId?: string | null
  }) {
    const text = content.trim()
    if (!text) return null
    const item = await outbox.add({
      id: newId(),
      channelId,
      content: text,
      parentId,
      createdAt: now().toISOString(),
    })
    void Promise.allSettled(
      transports.filter((t) => t.status() === 'connected').map((t) => pushTo(t, [item])),
    )
    void flush()
    return item
  }

  type FlushResult = { sent: number; failed: number; offline: boolean }
  let running: Promise<FlushResult> | null = null
  let again = false

  async function pass(): Promise<FlushResult> {
    let sent = 0
    let failed = 0
    const pending = (await outbox.list()).filter((i) => i.status === 'pending')
    if (pending.length === 0) return { sent, failed, offline: false }
    if (probe && !(await probe().catch(() => false))) return { sent, failed, offline: true }
    for (const item of pending) {
      let result: SendResult
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('sendToServer timeout')), sendTimeoutMs),
        )
        result = await Promise.race([sendToServer(item), timeoutPromise])
      } catch {
        return { sent, failed, offline: true }
      }
      if ('error' in result) {
        // Refus transitoire (ex. parent pas encore synchronisé) : on garde pending, jusqu'à la limite de date
        const expired = now().getTime() - Date.parse(item.createdAt) > MAX_BACKDATE_MS
        if (result.retryable && !expired) continue
        await outbox.markFailed(item.id, result.error)
        failed++
      } else {
        await outbox.remove(item.id)
        sent++
        const { data } = result
        if (onSent) void Promise.resolve().then(() => onSent(item, data)).catch(() => {})
      }
    }
    return { sent, failed, offline: false }
  }

  async function run(): Promise<FlushResult> {
    const total: FlushResult = { sent: 0, failed: 0, offline: false }
    do {
      again = false
      const r = await pass()
      total.sent += r.sent
      total.failed += r.failed
      total.offline = r.offline
      if (r.offline) break
    } while (again)
    if (total.sent || total.failed) onChange?.()
    return total
  }

  async function withFlushLock<T>(task: () => Promise<T>): Promise<T> {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
    if (!locks) return task()
    return locks.request(`attendancy-chat-flush:${userId}`, () => task())
  }

  // Un seul envoi à la fois. Un appel pendant un envoi en cours rejoint la
  // même exécution, qui repasse une fois de plus pour les messages ajoutés entre-temps.
  function flush(): Promise<FlushResult> {
    if (running) {
      again = true
      return running
    }
    running = withFlushLock(run).finally(() => {
      running = null
    })
    return running
  }

  async function receive(env: Envelope) {
    if (!env || env.v !== 1) return
    if (!isUuid(env.id) || !isUuid(env.channelId)) return
    if (typeof env.authorId !== 'string' || !env.authorId || env.authorId.length > 64) return
    if (env.authorId === userId) return
    if (acceptsChannel && !acceptsChannel(env.channelId)) return
    if (typeof env.content !== 'string' || !env.content.trim()) return
    if (Array.from(env.content).length > MAX_CONTENT_LENGTH) return
    if (env.parentId != null && !isUuid(env.parentId)) return
    if (typeof env.createdAt !== 'string' || Number.isNaN(Date.parse(env.createdAt))) return

    // Reconstruit l'enveloppe : aucun champ inconnu d'un pair n'entre dans IndexedDB
    const clean: Envelope = {
      v: 1,
      id: env.id,
      channelId: env.channelId,
      authorId: env.authorId,
      authorName: typeof env.authorName === 'string' ? env.authorName.slice(0, 100) : null,
      content: env.content,
      parentId: env.parentId ?? null,
      createdAt: env.createdAt,
      sig: typeof env.sig === 'string' ? env.sig : null,
    }
    if (await inbox.put(clean)) onChange?.()
  }

  async function resendPending(t: ChatTransport) {
    const pending = (await outbox.list()).filter((i) => i.status === 'pending')
    await pushTo(t, pending)
  }

  function start() {
    if (started) return
    started = true
    for (const t of transports) {
      unsubs.push(t.onReceive((env) => void receive(env)))
      unsubs.push(
        t.onStatus((s) => {
          if (s === 'connected') void resendPending(t)
        }),
      )
      t.start()
    }
    timer = setInterval(() => void flush(), flushIntervalMs)
    void inbox.purge().catch(() => {})
    void flush() // envoie ce qui attendait avant la fermeture de l'app
  }

  function stop() {
    if (!started) return
    started = false
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
    unsubs.splice(0).forEach((u) => u())
    transports.forEach((t) => t.stop())
  }

  function attach(t: ChatTransport) {
    const offs = [
      t.onReceive((env) => void receive(env)),
      t.onStatus((s) => {
        if (s === 'connected') void resendPending(t)
      }),
    ]
    if (!transports.includes(t)) transports.push(t)
    if (started) t.start()
    return () => {
      offs.forEach((off) => off())
      t.stop()
      const i = transports.indexOf(t)
      if (i >= 0) transports.splice(i, 1)
    }
  }

  return {
    send,
    flush,
    receive,
    start,
    stop,
    attach,
    retry: async (id: string, change?: { parentId: string | null }) => {
      await outbox.retry(id, change)
      return flush()
    },
    discard: (id: string) => outbox.remove(id),
    // À appeler avec les ids reçus du serveur : les copies "non vérifiées" disparaissent.
    confirm: (ids: string[]) => inbox.confirm(ids),
  }
}
```

## `ChatSyncProvider.tsx`

```tsx
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
  // Code du relais (bad_token, not_member...) ou local : `unsupported`, `insecure_context`,
  // `no_channels` (aucun canal connu au moment de la connexion : la séance reprend toute seule
  // quand la liste arrive). LanPanel doit avoir un libellé pour chacun.
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
  const resumeRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    userRef.current = user
    channelsRef.current = channelIds
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

    // Source unique des canaux actifs : hello, known, acceptsChannel et envoi aux pairs. Les canaux
    // imposés par connectLan (profil métier) priment sur la liste du provider, utilisée en repli.
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
```

`lan-transport.ts` et `useChat.ts` ne changent pas.

**Tests à ajouter dans les tests du moteur :**
- Un transport factice dont `send` rejette `not_member` pour le premier message et résout pour le second : le second doit partir.
- Le même transport avec `closed` pour le premier : le second ne doit pas partir.
- Un message d'un canal refusé par `acceptsChannel` : `send` n'est jamais appelé pour lui.

**Autre défaut, hors de ce lot (je n'y ai pas touché).** Dans `lan-transport.ts`, `send` écrase `acks.get(env.id)` si le même id est envoyé deux fois en même temps. Cela arrive quand `engine.send` pousse le message et que le statut `connected` déclenche `resendPending` au même moment. La première promesse ne se règle alors jamais : son minuteur appelle `settle`, qui ne trouve plus d'entrée. `pushTo` reste bloqué sur cet `await` et le reste du lot n'est envoyé qu'à la reconnexion suivante. Le correctif est de renvoyer la promesse existante quand l'id est déjà dans `acks`. À traiter dans une étape à part 
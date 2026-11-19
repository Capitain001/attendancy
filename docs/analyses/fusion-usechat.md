Voici l'adaptateur, par fichier et sans fichier complet pour l'existant. 


## Principe

Le moteur est un singleton par utilisateur, créé dans un provider (le dossier `modules/chat` cité dans ta policy), parce que l'outbox couvre tous les canaux et qu'un `useChat` n'en voit qu'un. Trois conséquences :

- Le moteur est hors de React. Il met à jour le cache des messages lui-même, avant que l'outbox soit vidée, pour éviter qu'un message clignote entre les deux.
- Il diffuse via un registre `canal → sendRealtimeMessage`, alimenté par chaque `useChat` monté.
- `useChat` ne garde plus d'état d'envoi. Il lit l'outbox et l'inbox du moteur.

## 1. Patch du package

`engine.ts` : réessai avec correction du parent, et transports ajoutables après le démarrage (le QR n'est scanné qu'après).

```ts
export type ChatSync = ReturnType<typeof createChatSync>

// début de createChatSync : copie propre, pour pouvoir ajouter des transports dynamiques
const transports = [...(deps.transports ?? [])]
let started = false

// attach(t) : permet d'ajouter un transport dynamique (ex: QR Code scanné plus tard)
function attach(t: ChatTransport) {
  const offs = [
    t.onReceive((env) => void receive(env)),
    t.onStatus((s) => { if (s === 'connected') void resendPending(t) }),
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

// start() démarre les transports enregistrés SANS écraser la liste en cas de stop() :
// transports.forEach((t) => {
//   unsubs.push(t.onReceive((env) => void receive(env)))
//   unsubs.push(t.onStatus((s) => { if (s === 'connected') void resendPending(t) }))
//   t.start()
// })
// return : { ..., attach,
//   retry: async (id: string, change?: { parentId: string | null }) => {
//     await outbox.retry(id, change); return flush()
//   } }
```

`outbox.ts` :

```ts
retry: (id: string, change?: Partial<Pick<OutboxItem, 'parentId'>>) =>
  patch(id, { status: 'pending', error: undefined, ...change }),
```

## 2. `modules/chat/realtime-registry.ts` (nouveau)

```ts
type Sender = (m: { id: string; content: string; createdAt: string; parentId: string | null }) => Promise<unknown>
const senders = new Map<string, Sender>()

export function registerRealtimeSender(channelId: string, send: Sender) {
  senders.set(channelId, send)
  return () => { if (senders.get(channelId) === send) senders.delete(channelId) }
}
// Aucun useChat monté pour ce canal : pas de diffusion, les autres rattrapent au prochain refetch
export const broadcastSent = (channelId: string, m: Parameters<Sender>[0]) => senders.get(channelId)?.(m)
```

## 3. `hooks/data/messages/keys.ts` (nouveau) et insertion dans le cache

```ts
// Construit la clé exacte via getEntityQueryKey (source unique de vérité issue de useEntity)
import { getEntityQueryKey } from '@/hooks/entity'

export const messagesKey = (channelId: string) => getEntityQueryKey('messages', { channelId })
```

```ts
// modules/chat/cache.ts : même sémantique que applyPayload("INSERT") dans useEntity ({ items, byId })
export function insertMessage(queryClient: QueryClient, channelId: string, record: { id: string }) {
  queryClient.setQueryData<any>(messagesKey(channelId), (old: any) => {
    if (!old) return old
    const currentItems: any[] = Array.isArray(old) ? old : old.items || []
    const currentById: Record<string, any> = Array.isArray(old)
      ? old.reduce((acc: any, item: any) => ({ ...acc, [item.id]: item }), {})
      : old.byId || {}

    const exists = !!currentById[record.id]
    const newItems = exists
      ? currentItems.map((item) => (item.id === record.id ? record : item))
      : [...currentItems, record]
    const newById = { ...currentById, [record.id]: record }

    return Array.isArray(old) ? newItems : { ...old, items: newItems, byId: newById }
  })
}
```

## 4. `modules/chat/ChatSyncProvider.tsx` (nouveau)

> **Prérequis package.json** (`apps/web/package.json`) :
> - `"@attendancy/chat": "workspace:*"`
> - `"idb-keyval": "^6.2.1"`

```tsx
'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createChatSync, createInbox, createLanTransport, createOutbox, type ChatSync, type Envelope,
  type Inbox, type Outbox, type OutboxItem, type Pairing, type SendResult } from '@attendancy/chat'
import { idbStore } from '@attendancy/chat/idb'
import { createMessageAction } from '@/services/message/actions'
import { MESSAGE } from '@/services/message/policy'
import { ERROR_CODES, type ErrorCode } from '@/config'
import { notifyChannelMembersAction } from '@/services/notification/domains/chat'
import { messageEntityPatch, mapMessageUser } from '@/hooks/data/messages/utils'
import type { PresenceUser } from '@/types'
import { insertMessage } from './cache'
import { broadcastSent } from './realtime-registry'

type Ctx = {
  engine: ChatSync; outbox: Outbox; inbox: Inbox
  version: number // incrémenté à chaque changement d'outbox ou d'inbox
  confirm: (ids: string[]) => Promise<void>
  connectLan: (p: Pairing) => void
  disconnectLan: () => void
}
const ChatSyncContext = createContext<Ctx | null>(null)
export const useChatSync = () => useContext(ChatSyncContext)

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])

// Codes d'erreur transitoires : le message reste pending et sera rejoué automatiquement
const RETRYABLE_CODES = new Set<string>([
  ERROR_CODES.UNAUTHORIZED, // token expiré après une session hors-ligne prolongée
  ERROR_CODES.SERVER,       // panne réseau/serveur temporaire
  ...(MESSAGE.RETRYABLE_CODES as readonly string[]), // ex: PARENT_MISSING
])

export function ChatSyncProvider({ user, channelIds, children }: { user: PresenceUser; channelIds: string[]; children: ReactNode }) {
  const queryClient = useQueryClient()
  const [version, setVersion] = useState(0)
  const [ctx, setCtx] = useState<Omit<Ctx, 'version'> | null>(null)
  const userRef = useRef(user)
  const channelsRef = useRef(channelIds)
  useEffect(() => { userRef.current = user; channelsRef.current = channelIds })

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    // Inbox propre à chaque compte : les messages de pairs ne se retrouvent pas chez le suivant
    const inbox = createInbox({ store: idbStore<{ env: Envelope; receivedAt: string }>(`attendancy-chat-inbox:${user.id}`) })
    const outbox = createOutbox({ store: idbStore<OutboxItem>('attendancy-chat-outbox'), userId: user.id, crossTab: true })

    const sendToServer = async (item: OutboxItem): Promise<SendResult> => {
      const vars = { id: item.id, channelId: item.channelId, content: item.content, parentId: item.parentId, createdAt: item.createdAt }
      // Exception (réseau KO, délai dépassé) = reste pending. Un renvoi est idempotent côté serveur.
      const res = await withTimeout(createMessageAction(vars), 20_000)
      if (!('data' in res) || !res.data) {
        const code = 'code' in res ? String(res.code) : ''
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
      userId: user.id, userName: user.name ?? null, outbox, inbox, sendToServer, onChange: bump,
      acceptsChannel: (id) => channelsRef.current.includes(id),
      // Une seule fois par message retiré de l'outbox : diffusion temps réel avec la date officielle, puis notification push.
      // S'exécute à chaque onSent (y compris en cas de rejeu avec created: false si l'ack précédent s'était perdu).
      onSent: (item, data) => {
        const { createdAt } = data as { createdAt: string | Date }
        void broadcastSent(item.channelId, {
          id: item.id, content: item.content, parentId: item.parentId,
          createdAt: new Date(createdAt).toISOString(),
        })?.catch(() => {})
        notifyChannelMembersAction({ channelId: item.channelId, messageId: item.id }).catch(() => {})
      },
    })

    let detachLan: (() => void) | undefined
    const connectLan = (p: Pairing) => {
      detachLan?.()
      detachLan = engine.attach(createLanTransport({
        url: p.url, token: p.token, userId: user.id, name: userRef.current.name,
        channels: channelsRef.current, known: () => inbox.knownIds(channelsRef.current),
      }))
    }

    const offOutbox = outbox.subscribe(bump)
    const onOnline = () => void engine.flush()
    window.addEventListener('online', onOnline)
    engine.start() // envoie aussi ce qui attendait avant la fermeture de l'app

    setCtx({
      engine, outbox, inbox, connectLan,
      disconnectLan: () => { detachLan?.(); detachLan = undefined },
      confirm: async (ids) => { await inbox.confirm(ids); bump() },
    })
    return () => {
      window.removeEventListener('online', onOnline)
      offOutbox(); detachLan?.(); engine.stop(); outbox.close(); setCtx(null)
    }
  }, [user.id, queryClient]) // userRef/channelsRef : valeurs courantes, sans recréer le moteur

  return <ChatSyncContext.Provider value={ctx && { ...ctx, version }}>{children}</ChatSyncContext.Provider>
}
```

```ts
// modules/chat/useChatSyncState.ts : outbox et inbox du canal, rechargées à chaque changement
export function useChatSyncState(channelId: string) {
  const sync = useChatSync()
  const [state, setState] = useState<{ outbox: OutboxItem[]; inbox: Envelope[] }>({ outbox: [], inbox: [] })
  useEffect(() => {
    if (!sync) return
    let cancelled = false
    void Promise.all([sync.outbox.list(channelId), sync.inbox.list(channelId)]).then(([outbox, inbox]) => {
      if (!cancelled) setState({ outbox, inbox })
    })
    return () => { cancelled = true }
  }, [sync?.version, sync?.outbox, sync?.inbox, channelId])
  return state
}
```

## 5. `types.ts` (hooks/chat)

```ts
export type MessageStatus = 'sending' | 'sent' | 'failed' | 'unverified'
```

`OutboxEntry` et `OutboxDraft` ne sont plus utilisés par `useChat` : tu peux les supprimer.

## 6. `useChat.ts`

**À supprimer** : le `useState` de l'outbox, `sendNotifications`, `persist`, l'ancien `sendMessage`, l'ancien `retryMessage`, `persistMessage` dans la destructuration de `useMessages`, et les imports devenus inutiles (`OutboxDraft`, `OutboxEntry`, `notifyChannelMembersAction`).

**À ajouter**, après `useRealtimeChat` :

```ts
const sync = useChatSync()
const { outbox: outboxItems, inbox: inboxEnvelopes } = useChatSyncState(channelId)

// Le moteur (hors React) diffuse via le hook temps réel de CE canal
useEffect(() => registerRealtimeSender(channelId, sendRealtimeMessage), [channelId, sendRealtimeMessage])

// Un message de pair déjà confirmé par le serveur n'a plus besoin de sa copie « non vérifiée »
useEffect(() => {
  if (!sync || inboxEnvelopes.length === 0 || !data?.items?.length) return
  const persistedIds = new Set(data.items.map((m) => m.id))
  const done = inboxEnvelopes.filter((e) => persistedIds.has(e.id)).map((e) => e.id)
  if (done.length) void sync.confirm(done)
}, [sync, inboxEnvelopes, data?.items])
```

**La fusion** : le début du `useMemo` est remplacé, avec la source de chaque message mémorisée pour calculer son statut.

```ts
const persisted = data?.items ? mapMessages(data.items) : []

const pending: RealtimeMessage[] = outboxItems
  .filter((item) => item.channelId === channelId)
  .map((item) => ({
    id: item.id, content: item.content, parentId: item.parentId, createdAt: item.createdAt,
    editedAt: null, user: { id: user?.id ?? null, name: user?.name || ANONYMOUS_NAME },
  }))

// Messages de pairs (LAN) pas encore confirmés par le serveur
const unverified: RealtimeMessage[] = inboxEnvelopes
  .filter((env) => env.channelId === channelId)
  .map((env) => ({
    id: env.id, content: env.content, parentId: env.parentId ?? null, createdAt: env.createdAt,
    editedAt: null, user: { id: env.authorId, name: env.authorName || ANONYMOUS_NAME },
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
add(persisted, 'persisted'); add(realtimeMessages, 'realtime'); add(unverified, 'inbox'); add(pending, 'outbox')
const failedIds = new Set(outboxItems.filter((i) => i.status === 'failed').map((i) => i.id))
```

Dans le `.map` final de la fusion, le statut devient :

```ts
status:
  sources.get(message.id) === 'outbox' ? (failedIds.has(message.id) ? 'failed' : 'sending')
  : sources.get(message.id) === 'inbox' ? 'unverified'
  : 'sent',
```

Les deps du `useMemo` : remplace `outbox` par `outboxItems, inboxEnvelopes`.

**Envoi, réessai, abandon** :

```ts
const sendMessage = useCallback(
  async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newMessage.trim()
    // Plus de garde `isConnected` : l'envoi marche hors ligne, l'outbox est persistante
    if (!content || !sync) return

    setNewMessage('')
    notifyTyping(false)
    setReplyTarget(null)
    await sync.engine.send({ channelId, content, parentId: replyToId })
  },
  [newMessage, sync, channelId, replyToId, notifyTyping]
)

const retryMessage = useCallback(
  (id: string, { withoutReply = false }: { withoutReply?: boolean } = {}) =>
    sync?.engine.retry(id, withoutReply ? { parentId: null } : undefined),
  [sync]
)

const discardMessage = useCallback((id: string) => sync?.engine.discard(id), [sync])
```

Au `return` : ajouter `discardMessage`.

**`startReply`**,  aujourd'hui il refuse tout message non `'sent'`. Avec un moteur qui garde `pending` un refus transitoire, tu peux répondre à un message `unverified` (ou à un des tiens encore en attente : l'outbox part dans l'ordre, donc le parent précède la réponse). Dans ce cas la condition devient `status === 'failed'` seulement. Sans cet assouplissement, on ne peut pas répondre aux messages LAN

## Points à vérifier

1. **Session expirée** : un `{ error, code }` d'authentification (`ERROR_CODES.UNAUTHORIZED`) est intégré dans `RETRYABLE_CODES` dans `sendToServer` pour garder le message en `pending` le temps que l'utilisateur rafraîchisse sa session, au lieu d'un échec définitif.
2. **Forme normalisée du cache** : `insertMessage` respecte la structure `{ items, byId }` produite par `useEntity`, garantissant que `useChat` et `useOlderMessages` continuent à consommer `data.items` sans altération de type.
3. **Clé de cache** : `messagesKey` doit rester égale à la clé que `useEntity` construit avec `entityName` et `initialParams`. Un test qui compare les deux évite qu'un changement de l'une casse silencieusement l'autre.
4. **Déconnexion** : l'inbox est propre au compte (`attendancy-chat-inbox:<id>`), évitant toute fuite entre comptes. À la déconnexion, elle peut être vidée si souhaité. L'outbox reste, puisqu'elle est filtrée par `userId` et rejouera au prochain login.
5. **Diffusion sans canal monté** : si aucun `useChat` n'est monté pour ce canal (message envoyé depuis la file au démarrage), il n'y a pas de diffusion temps réel active. Les autres le voient à leur prochain refetch, et le push part quand même via `notifyChannelMembersAction`. C'est un comportement acceptable.
6. **LAN en `https`** : les navigateurs bloquent `ws://` depuis une page `https` hors `localhost` (Mixed Content). Le test du transport LAN se fait sur la cible réelle (app Tauri native ou serveur en `http`).

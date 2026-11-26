Oui, extraire un hook est plus propre : tu supprimes un useState, un useEffect, deux gardes typeof window et la clé construite à deux endroits, et tu peux réutiliser le hook ailleurs. Mais la version proposée change le comportement de ton code actuel, donc pas tel quel.

Problèmes de la version proposée

Fuite d'un canal à l'autre. Quand channelId change et que la nouvelle clé n'existe pas, if (item) ne fait rien et storedValue garde la valeur du canal précédent. Si le canal A est muet, le canal B le devient aussi. Ton code actuel évite ça avec setIsMuted(saved === '1'), qui réinitialise toujours.
setValue instable. Elle est recréée à chaque rendu, donc un useCallback qui en dépend se recrée aussi. Elle lit en plus storedValue par fermeture, donc deux appels rapprochés peuvent partir d'une valeur périmée.
Format différent. Tu stockes '1'/'0', le hook stocke du JSON. JSON.parse('1') donne le nombre 1, pas true. Ça marche par truthiness (1 est vrai, 0 est faux), et la valeur se corrige au premier basculement. Le type boolean ment toutefois jusque-là. Sinon, change la clé en chat:mute:v2:${channelId}.

Version corrigée

ts
// src/hooks/useLocalStorage.ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  // Ref : évite de relancer la lecture quand l'appelant passe un objet littéral
  const initialRef = useRef(initialValue)

  // Lecture après le montage (évite l'écart d'hydratation SSR) et à chaque changement de clé
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      setStoredValue(item === null ? initialRef.current : (JSON.parse(item) as T))
    } catch (error) {
      console.error(`Erreur de lecture localStorage "${key}":`, error)
      setStoredValue(initialRef.current)
    }
  }, [key])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch (error) {
          console.error(`Erreur d'écriture localStorage "${key}":`, error)
        }
        return next
      })
    },
    [key],
  )

  return [storedValue, setValue] as const
}

Les différences : la valeur initiale est restaurée quand la clé est absente ou illisible, et setValue est mémoïsée avec une mise à jour fonctionnelle (plus de valeur périmée). L'écriture dans l'updater est idempotente : si React l'exécute deux fois en StrictMode, le résultat est le même.

Dans useChat

ts
const [isMuted, setIsMuted] = useLocalStorage(`chat:mute:${channelId}`, false)

const toggleMute = useCallback(() => setIsMuted((prev) => !prev), [setIsMuted])

Tu peux supprimer useState pour isMuted, le useEffect de lecture, et l'ancien toggleMute. sendNotifications n'a pas besoin d'autre changement.

Limites (les deux versions les ont) :

Pas de synchronisation entre onglets : il faudrait écouter l'événement storage.
Un bref rendu avec la valeur initiale avant la lecture. Pour un état de sourdine c'est sans conséquence ; sinon useSyncExternalStore règle ça proprement.

Pour la cohérence avec tes autres hooks (useMessages, useChat), nomme le fichier useLocalStorage.ts plutôt que use-local-storage.ts.

Voici l'adaptateur, par fichier et sans fichier complet pour l'existant. Une correction d'abord : j'avais écrit à l'étape précédente « push seulement si created », et c'est faux. Si le serveur crée le message mais que la réponse se perd, le renvoi donne created: false, et onSent n'a jamais tourné pour la première tentative. Le push ne partirait alors jamais. Il faut donc notifier à chaque onSent, qui ne s'exécute qu'une fois par retrait de l'outbox.

Principe

Le moteur est un singleton par utilisateur, créé dans un provider (le dossier modules/chat cité dans ta policy), parce que l'outbox couvre tous les canaux et qu'un useChat n'en voit qu'un. Trois conséquences :

Le moteur est hors de React. Il met à jour le cache des messages lui-même, avant que l'outbox soit vidée, pour éviter qu'un message clignote entre les deux.
Il diffuse via un registre canal → sendRealtimeMessage, alimenté par chaque useChat monté.
useChat ne garde plus d'état d'envoi. Il lit l'outbox et l'inbox du moteur.
1. Patch du package

engine.ts : réessai avec correction du parent, et transports ajoutables après le démarrage (le QR n'est scanné qu'après).

ts
export type ChatSync = ReturnType<typeof createChatSync>

// début de createChatSync : copie propre, pour pouvoir ajouter des transports
const transports = [...(deps.transports ?? [])]   // retirer `transports = []` de la destructuration
let started = false

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

// start() : started = true ; transports.forEach((t) => unsubs.push(attach(t)))  (au lieu de la boucle actuelle)
// return : { ..., attach,
//   retry: async (id: string, change?: { parentId: string | null }) => {
//     await outbox.retry(id, change); return flush()
//   } }

outbox.ts :

ts
retry: (id: string, change?: Partial<Pick<OutboxItem, 'parentId'>>) =>
  patch(id, { status: 'pending', error: undefined, ...change }),
2. modules/chat/realtime-registry.ts (nouveau)
ts
type Sender = (m: { id: string; content: string; createdAt: string; parentId: string | null }) => Promise<unknown>
const senders = new Map<string, Sender>()

export function registerRealtimeSender(channelId: string, send: Sender) {
  senders.set(channelId, send)
  return () => { if (senders.get(channelId) === send) senders.delete(channelId) }
}
// Aucun useChat monté pour ce canal : pas de diffusion, les autres rattrapent au prochain refetch
export const broadcastSent = (channelId: string, m: Parameters<Sender>[0]) => senders.get(channelId)?.(m)
3. hooks/data/messages/keys.ts (nouveau) et insertion dans le cache
ts
// Doit rester identique à la clé construite par useEntity : [entityName, initialParams]
export const messagesKey = (channelId: string) => ['messages', { channelId }] as const
ts
// modules/chat/cache.ts : même sémantique que applyPayload("INSERT")
export function insertMessage(queryClient: QueryClient, channelId: string, record: { id: string }) {
  queryClient.setQueryData<{ id: string }[]>(messagesKey(channelId), (old) =>
    !old // canal jamais ouvert : le prochain fetch contiendra le message (il est en base)
      ? old
      : old.some((m) => m.id === record.id)
        ? old.map((m) => (m.id === record.id ? record : m))
        : [...old, record],
  )
}
4. modules/chat/ChatSyncProvider.tsx (nouveau)
tsx
'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createChatSync, createInbox, createLanTransport, createOutbox, type ChatSync, type Envelope,
  type Inbox, type Outbox, type OutboxItem, type Pairing, type SendResult } from '<ton-package>'
import { idbStore } from '<ton-package>/idb-store'
import { createMessageAction } from '@/services/message/actions'
import { MESSAGE } from '@/services/message/policy'
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
          retryable: (MESSAGE.RETRYABLE_CODES as readonly string[]).includes(code),
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
      // Une seule fois par message : diffusion avec la date retenue par le serveur, puis push.
      // Pas de condition sur `created` : un rejeu (ack perdu) doit aussi notifier.
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
ts
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
5. types.ts (hooks/chat)
ts
export type MessageStatus = 'sending' | 'sent' | 'failed' | 'unverified'

OutboxEntry et OutboxDraft ne sont plus utilisés par useChat : tu peux les supprimer.

6. useChat.ts

À supprimer : le useState de l'outbox, sendNotifications, persist, l'ancien sendMessage, l'ancien retryMessage, persistMessage dans la destructuration de useMessages, et les imports devenus inutiles (OutboxDraft, OutboxEntry, notifyChannelMembersAction).

À ajouter, après useRealtimeChat :

ts
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

La fusion : le début du useMemo est remplacé, avec la source de chaque message mémorisée pour calculer son statut.

ts
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

Dans le .map final de la fusion, le statut devient :

ts
status:
  sources.get(message.id) === 'outbox' ? (failedIds.has(message.id) ? 'failed' : 'sending')
  : sources.get(message.id) === 'inbox' ? 'unverified'
  : 'sent',

Les deps du useMemo : remplace outbox par outboxItems, inboxEnvelopes.

Envoi, réessai, abandon :

ts
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

Au return : ajouter discardMessage.

startReply, à décider : aujourd'hui il refuse tout message non 'sent'. Avec un moteur qui garde pending un refus transitoire, tu peux répondre à un message unverified (ou à un des tiens encore en attente : l'outbox part dans l'ordre, donc le parent précède la réponse). Dans ce cas la condition devient status === 'failed' seulement. Sans cet assouplissement, on ne peut pas répondre aux messages LAN, ce qui est probablement ce que tu veux permettre.

Points à vérifier
Session expirée : un { error, code } d'authentification place le message en failed, définitif. Pour une file hors ligne, c'est plutôt un état transitoire (l'utilisateur se reconnecte). Ajoute le code d'authentification à retryable dans sendToServer, ou à RETRYABLE_CODES.
channelIds du provider : je ne sais pas d'où viennent les canaux de l'utilisateur. Ils servent à acceptsChannel et au hello du hub, où ils doivent peut-être se limiter à celui de la séance (sessionId du QR). Le hub refuse la connexion (not_member) si aucun canal n'est autorisé.
Clé de cache : messagesKey doit rester égale à la clé que useEntity construit avec entityName et initialParams. Un test qui compare les deux évite qu'un changement de l'une casse silencieusement l'autre.
Déconnexion : l'inbox est propre au compte, mais le provider ne la vide pas. À la déconnexion, vide attendancy-chat-inbox:<id>. L'outbox doit rester, puisqu'elle est filtrée par userId et rejouera au prochain login.
Diffusion sans canal monté : si aucun useChat n'est monté pour ce canal (message envoyé depuis la file au démarrage), il n'y a pas de diffusion. Les autres le voient à leur prochain refetch, et le push part quand même. Si l'émetteur n'est pas connecté en temps réel, sendRealtimeMessage ne fait rien non plus. C'est un défaut acceptable, pas une perte de message.
LAN en https : comme dit plus haut, ws:// est bloqué depuis une page https hors localhost. Le test se fait sur la cible réelle (Tauri ou page en http).
PresenceUser.id est maintenant obligatoire : le provider peut exiger user: PresenceUser sans garde, et user?.id ?? null ne change pas.

Il reste à placer ChatSyncProvider au niveau où user et la liste des canaux sont connus, sous le QueryClientProvider. Je ne vois pas ton arbre de layout, donc je n'ai pas proposé d'endroit précis.

//apps\chat\src\routes\_app\route.tsx
import { useMemo } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth, useAuthUser } from "@attendancy/auth";
import { toPresenceUser } from "@attendancy/user";
import { ChatSyncProvider } from "@/modules/chat";

export const Route = createFileRoute("/_app")({
  beforeLoad: requireAuth,
  component: AppLayout,
});

function AppLayout() {
  const user = useAuthUser();
  // Même identité tant que l'utilisateur ne change pas : ChatSyncProvider ne relance rien
  const presenceUser = useMemo(
    () => (user ? toPresenceUser(user) : null),
    [user],
  );

  // Local et immédiat : seulement le temps que la session se résolve, jamais le réseau
  if (!presenceUser) return null;

  return (
    <ChatSyncProvider user={presenceUser} channelIds={[]}>
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
    </ChatSyncProvider>
  );
}

on peut avoir des route enfant tel que , src\routes\_app\channels ou src\routes\_app\channels.$channelId.tsx , ou encore rooms je te laisse decider de la disposition 

je te donne un exemple de ma config rpc et l appelle de mes api :
pour les actions :
import { api } from "@rpc-api";

const channelId =""
const message =  api.getMessagesAction({channelId})

pour les hooks :
on importes le hook exactement comme dans apps/web (@/hooks/chat/useChat), car :

apps/chat résout @/ vers ../web/src/
les imports @/services/<service>/actions à l'intérieur du hook (useMessages, useOlderMessages, useChannelMute) sont interceptés au build Vite par l'alias regex ^@/services/([^/]+)(\/actions)?$ → packages/rpc/src/generated/$1.ts → @rpc-api (apps/chat/src/lib/api.ts) avec le Bearer JWT Supabase.
ChatSyncProvider est déjà monté par apps/chat/src/routes/_app/route.tsx, donc useChatSync() fonctionne automatiquement dans toutes les routes enfants de _app.
Exemple de route (apps/chat/src/routes/_app/test.tsx)
tsx
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAuthUser } from "@attendancy/auth";
import { toPresenceUser } from "@attendancy/user";
import { useChat } from "@/hooks/chat/useChat";
export const Route = createFileRoute("/_app/test")({
  component: ChatHookTestPage,
});
function ChatHookTestPage() {
  const [channelId, setChannelId] = useState("uuid-du-canal");
  const authUser = useAuthUser();
  const presenceUser = useMemo(
    () => (authUser ? toPresenceUser(authUser) : undefined),
    [authUser],
  );
  const {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    isConnected,
    loading,
    connectedUsers,
    userName,
    isMuted,
    toggleMute,
  } = useChat({
    channelId,
    user: presenceUser,
  });
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>Canal : {channelId} · {isConnected ? "Connecté" : "Déconnecté"}</div>
      <div>Moi : {userName} · En ligne : {connectedUsers.length}</div>
      <button type="button" onClick={toggleMute}>
        {isMuted ? "Réactiver" : "Couper"} les notifications
      </button>
      {loading ? (
        <p>Chargement…</p>
      ) : (
        <ul>
          {messages.map((m) => (
            <li key={m.id}>
              <strong>{m.user.name} :</strong> {m.content}
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
      >
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Message…"
        />
        <button type="submit">Envoyer</button>
      </form>
    </div>
  );
}

NB: je me chargerais des branchement interne pour  que les appelle fonctionne correctement 

on passe a l ui

Je lis d'abord les conventions de design avant d'écrire les composants.

L'UI est écrite : six fichiers partagés (ChatThread, MessageList, MessageBubble, Composer, styles, format) et quatre côté chat (channels.tsx, channels.index.tsx, channels.$channelId.tsx, ChannelList). Je n'ai rien compilé ni lancé.

Disposition
Routes : /channels (liste et fil côte à côte), /channels seul (invitation à choisir) et /channels/$channelId. Sur mobile, un seul volet à la fois, avec un lien « Canaux » pour revenir. J'ai laissé rooms de côté : la structure s'y prête (rooms.tsx, rooms.$roomId.tsx), mais rien n'indique encore ce qu'est une salle.
Partage : tout ce qui ne dépend pas du routeur est dans modules/chat/ui/ (réutilisable par l'app web). Seules ChannelList et les routes vivent dans apps/chat.
Fil : monté avec key={channelId}, donc un changement de canal repart d'un état vierge (défilement, saisie, édition en cours).
Ce que gère l'interface
Défilement : ouverture en bas, suivi des nouveaux messages si on est en bas, bouton « N nouveaux messages » sinon. Le chargement de l'historique conserve la position (restaurée à la main, overflow-anchor désactivé pour ne pas corriger deux fois) et se déclenche en remontant, avec un bouton pour le clavier.
Citations : cliquer sur l'aperçu défile jusqu'au message d'origine, le charge au besoin, puis le met en évidence. Trop ancien : un message l'indique.
États d'envoi : « Envoi en cours… », échec avec « Réessayer », « Envoyer sans citation » si le parent est parti, et « Abandonner ». Un message de pair non confirmé a une bordure pointillée et « Reçu en local, non confirmé ». Aucun état ne repose sur la couleur seule.
Actions : répondre, modifier (Entrée enregistre, Échap annule), supprimer avec confirmation en ligne dont le focus est sur « Annuler ». Elles apparaissent au survol ou au focus, et restent visibles sur écran tactile.
Saisie : zone qui grandit, Entrée envoie sur ordinateur et retourne à la ligne sur écran tactile, composition (IME) respectée, Échap annule la réponse, compteur près de la limite.
Accessibilité : annonce des seuls messages entrants, animations réduites respectées, focus visible partout, indicateur « écrit… » à hauteur réservée.
Hors ligne : le bandeau n'apparaît qu'après 2 s de déconnexion, pour ne pas clignoter à l'ouverture. L'envoi n'est plus bloqué par isConnected.
Ce que je n'ai pas pu vérifier
useChannels : j'ai supposé @/hooks/data/channels/useChannels avec data.items et data.byId (forme de useEntity), et des canaux ayant id et name. C'est le seul endroit à adapter.
channelIds={[]} dans _app/route.tsx : le provider s'en sert pour acceptsChannel et le hello du hub. Avec une liste vide, tout message de pair est rejeté et le hub répond not_member. Il faut y passer les ids des canaux (le provider relit la liste à chaque rendu, donc un tableau qui change est accepté).
MESSAGE_MAX_LENGTH : à ajouter à @/services/message/constants.ts (export const MESSAGE_MAX_LENGTH = 4000), et à utiliser aussi dans createMessageSchema pour qu'il n'y ait qu'une valeur.
Adaptateur appliqué : l'interface appelle discardMessage et retryMessage(id, { withoutReply }), donc elle suppose que le patch de l'adaptateur est dans ton useChat.
Design system : je n'ai que le SKILL.md, pas les fichiers sources de @/styles. J'ai utilisé uniquement les tokens listés (background, foreground, card, secondary, border, destructive, ring, input-surface, input-focus, primary) et text-foreground/60 pour le texte secondaire. Pour le bouton « Envoyer », j'ai pris button.primary tel quel : sa taille est celle d'un CTA, donc peut-être massive dans une barre de saisie. Si c'est le cas, ajoute une variante button.compact dans button.ts plutôt que de la surcharger sur place.
Tailwind : je n'ai pas utilisé les paliers sm:/md: mais max-md:, comme le système. Les tailles sont en rem et pas en em, plus adaptées à une zone dense.
Hauteur : l'arbre doit être borné en hauteur pour que la liste défile en interne. Le conteneur racine doit être en h-dvh (pas h-screen, à cause de la barre d'adresse mobile) avec min-h-0 sur les enfants flex.

Deux points sur ton exemple de route de test, avant qu'il ne te fasse perdre du temps : sendMessage() y est appelé sans argument, alors qu'il attend l'événement du formulaire (il appelle e.preventDefault()) et planterait. Et connectedUsers.length n'existe pas, puisque c'est un objet : utilise otherUsers.length.

Hors périmètre
Avatars : l'identité (user.id) est là, mais pas encore la source de l'image. On avait dit d'optimiser après.
Appairage LAN (scan du QR code, appel de connectLan) : une vraie fonctionnalité d'interface, à part.
Aperçu hors ligne : un message en attente ne peut ni être cité ni édité, ce qui est cohérent avec les règles côté serveur.

Prochaine étape possible : l'écran d'appairage LAN, ou un passage de relecture sur les points 1 à 3 une fois branchés.

ChatThread
Code
·TSX
MessageList
Code
·TSX
MessageBubble
Code
·TSX
Composer
Code
·TSX
Styles
Code
·TS
Format
Code
·TS
Channels
Code
·TSX
channels.$channelId
Code
·TSX
Channels.index
Code
·TSX
ChannelList
Code
·TSX

prochaine etape: LAN

Local
Code
·TSX
HostLan
Code
·TSX
JoinLan
Code
·TSX
LanPanel
Code
·TSX
QrScanner
Code
·TSX
Lan status
Code
·TS
useSyncCounts
Code
·TS
useDelayedFlag
Code
·TS

Continuer

Les fichiers de l'étape LAN sont écrits : LanPanel, JoinLan, HostLan, QrScanner, lan-status, useSyncCounts, useDelayedFlag et la route /local. Ma réponse précédente s'est coupée avant les modifications des fichiers existants, dont l'écran dépend. Je n'ai rien compilé ni testé.

1. lan-transport.ts : raison du refus et page https

Un bug réel : depuis une page https, new WebSocket('ws://192.168…') lève une SecurityError tout de suite. Dans connect(), l'exception laisse l'état bloqué sur connecting pour toujours.

ts
let failure: string | null = null   // à côté de `fatal`

async function connect() {
  if (stopped) return
  if (!Impl) { failure = 'unsupported'; fatal = true; return setState('closed') }
  setState('connecting')
  const known = opts.known ? await opts.known().catch(() => []) : []
  if (stopped) return

  let sock: WebSocketLike
  try {
    sock = new Impl(opts.url)
  } catch {
    // Page https qui ouvre ws:// : le navigateur refuse immédiatement
    failure = 'insecure_context'; fatal = true; return setState('closed')
  }
  ws = sock
  // ...
}

// dans le traitement d'un « reject » sans id
else if (FATAL.has(String(f.reason))) { fatal = true; failure = String(f.reason); sock.close() }

// start() : failure = null ; au return de l'objet transport : failure: () => failure,

failure est assigné avant setState('closed'), donc le callback d'état la lit déjà. Dans engine.ts, ajoute à ChatTransport : failure?(): string | null.

2. ChatSyncProvider.tsx : état du LAN exposé

Jusqu'ici, connectLan ne rendait aucun état. L'écran a besoin du statut, de la raison de refus et de l'appairage courant. Le code est gardé dans sessionStorage (jeton de séance, effacé à la fermeture de l'onglet) pour survivre à un rechargement.

tsx
const LAN_KEY = 'attendancy-chat-lan'
type LanState = { status: TransportStatus; failure: string | null; pairing: Pairing | null }
const LAN_IDLE: LanState = { status: 'idle', failure: null, pairing: null }

// Ctx : lan: LanState        état : const [lan, setLan] = useState<LanState>(LAN_IDLE)
// Provider : value={ctx && { ...ctx, version, lan }}

// dans l'effet, à la place de connectLan / disconnectLan
const forget = () => { try { sessionStorage.removeItem(LAN_KEY) } catch { /* indisponible */ } }

const connectLan = (p: Pairing) => {
  detachLan?.()
  const transport = createLanTransport({
    url: p.url, token: p.token, userId: user.id, name: userRef.current.name,
    channels: channelsRef.current, known: () => inbox.knownIds(channelsRef.current),
  })
  // Abonné AVANT attach : le premier « connecting » n'est pas manqué
  const offStatus = transport.onStatus((status) => {
    const failure = transport.failure?.() ?? null
    if (failure) forget() // un code refusé ne doit pas être rejoué au rechargement
    setLan({ status, failure, pairing: p })
  })
  const detach = engine.attach(transport)
  detachLan = () => { offStatus(); detach() }
  setLan({ status: transport.status(), failure: null, pairing: p })
  try { sessionStorage.setItem(LAN_KEY, encodePairing(p)) } catch { /* indisponible */ }
}

const disconnectLan = () => {
  detachLan?.(); detachLan = undefined; forget(); setLan(LAN_IDLE)
}

// après engine.start() : reprise après rechargement. decodePairing revalide format et hôte local.
try {
  const saved = sessionStorage.getItem(LAN_KEY)
  const pairing = saved ? decodePairing(saved) : null
  if (pairing) connectLan(pairing)
} catch { /* rien à reprendre */ }

// nettoyage de l'effet : ajouter setLan(LAN_IDLE)
3. ChatThread.tsx : l'état du fil tient compte du LAN

Un fil sans Internet mais relié au réseau local n'est pas « hors ligne » : ses messages circulent. Supprime la fonction useDelayedFlag locale (et les imports useEffect / useState devenus inutiles) et importe celle de ./useDelayedFlag.

tsx
import { useChatSync } from '@/modules/chat'
import { useDelayedFlag } from './useDelayedFlag'

const onLan = useChatSync()?.lan.status === 'connected'
const reachable = isConnected || onLan
const offline = useDelayedFlag(!reachable, 2000)
const lanOnly = useDelayedFlag(!isConnected && onLan, 2000)
const connection = isConnected ? 'Connecté' : onLan ? 'Réseau local' : 'Hors ligne'

// en-tête : la pastille suit `reachable`, le libellé affiche `connection`
<span aria-hidden className={cn(chat.dot, reachable ? 'border-primary bg-primary' : 'border-foreground/60')} />
{connection}

// bandeaux, exclusifs l'un de l'autre
{lanOnly && (
  <p role="status" className={cn(typography.xsmall, chat.banner)}>
    Réseau local uniquement. Vos messages sont partagés avec les appareils proches et seront confirmés au retour d&apos;Internet.
  </p>
)}
{offline && ( /* bandeau « Hors ligne » existant */ )}
4. Navigation

La page /local est hors du layout des canaux, donc elle n'a ni liste ni retour. Dans ChannelList, en dernier enfant du conteneur racine (toujours visible, quelle que soit la branche chargement ou vide) :

tsx
<div className="border-t border-border p-2">
  <Link
    to="/local"
    className={cn(typography.small, 'block rounded-md px-3 py-2 text-foreground/80 hover:bg-secondary',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
  >
    Réseau local
  </Link>
</div>

Dans local.tsx, un lien de retour au-dessus de <LanPanel /> :

tsx
<Link to="/channels" className="m-6 mb-0 inline-block rounded-md px-2 py-1 text-foreground/70 hover:bg-secondary">
  Retour aux canaux
</Link>
Comment ça se comporte
Élève : « Scanner le code » (si le navigateur sait lire un QR) ou collage du lien, toujours disponible. Le scanner continue tant que le code lu n'est pas valide. Un lien refusé donne un message d'erreur dans l'écran, pas un échec silencieux.
États : non connecté, connexion en cours (avec un rappel de vérifier le Wi-Fi après 10 s), connecté, refusé avec la raison (code périmé, pas membre, page sécurisée). Le point est plein, creux, pointillé ou plein de couleur d'erreur, et le libellé le redit.
Compteurs : messages en attente d'envoi, échoués, et reçus en local pas encore confirmés. C'est ce qui rassure quand on est hors ligne.
Enseignant : HostLan lance le relais via un HubController, affiche le QR et un lien copiable, et rejoint son propre relais par 127.0.0.1 (accepté par isLocalHost, y compris depuis une page https).
À ta charge
HubController : l'interface a trois méthodes (start({ token }), stop(), current()). Côté natif, start lance chat-relay --token <t> --port <p> en sidecar et renvoie l'adresse IPv4 du réseau : le relais n'affiche que son adresse de liaison (0.0.0.0:port), inutilisable dans un QR. Ça demande une commande native (par exemple le crate local-ip-address). Sans hub et sessionId, la page n'affiche que « Rejoindre ».
Dépendance : qrcode.react pour le QR (côté enseignant). Pour ne pas alourdir l'app des élèves, charge HostLan en lazy dans LanPanel.
'<ton-package>' : le nom d'import du package reste un repère dans lan-status.ts, JoinLan.tsx et HostLan.tsx.
Hub et renommage : sent_at → created_at doit être déployé avec le package, sinon les trames sont rejetées en bad_frame.
Limites à connaître
Caméra : getUserMedia exige une page sécurisée (https ou localhost), donc elle ne marchera pas dans une page http:// servie sur le LAN. BarcodeDetector est surtout présent sur Chrome et Edge Android, pas sur Safari ni Firefox. D'où le collage du lien comme chemin permanent. Dans une app Tauri mobile, remplace l'intérieur de QrScanner par le plugin barcode-scanner : le contrat (onResult renvoie vrai si accepté) ne change pas.
Page https : la détection ci-dessus affiche « Utilisez l'application installée ». Le LAN ne fonctionnera que dans le shell natif ou une page en http.
Seule barrière : le jeton. Sans --members, quiconque voit le QR rejoint la séance et peut écrire dans n'importe quel canal. C'est acceptable dans une salle de classe, et le statut « non confirmé » couvre le faux auteur en attendant la phase sig. Pour aller plus loin, il faudra un fichier --members issu d'une liste de membres mise en cache avant la séance.
Fond blanc codé en dur derrière le QR : seule exception aux tokens. Un lecteur exige un fort contraste clair, même en thème sombre.
Non couvert : le nombre de pairs (la trame welcome le porte déjà, le transport l'ignore) et la fermeture de séance côté élèves quand le relais s'arrête (ils retombent en reconnexion avec attente croissante).

La suite logique, côté interface, serait la relecture à l'écran de tout ce qu'on a branché, ou les avatars, sur lesquels on s'était donné rendez-vous.

n envoie plus de code complet tant que le plan n est pas acter 

tu a soulever bcp de point et laisser bcp de zone morte qui n aide pas au teste et a l implmentation exemple : HubController

on va y aller pas a pas je vas t expliquer la vision de cette partie lan :

le code du chat vie dans le pakage ui :

packages/ui/src/components/chat/
├── useDelayedFlag.ts
└── lan/
    ├── lan-status.ts
    ├── QrScanner.tsx
    ├── JoinLan.tsx
    └── HostLan.tsx

apps/web/src/modules/chat/lan/
├── useSyncCounts.ts
└── LanPanel.tsx

apps/chat/src/routes/_app/
└── local.tsx

pas de couplage metier direct :
-ma vision , un moteur qui s adapte au contexte metier ( chat peer to peer , class ( qr code revien au teacher ) , channel owner , ect ) donc une separation entre le moteur et son implementation 

la structure actuelle le permet 

il faut donc qu on construise brique par brique , implmenter et tester le lan (parring offline ) sans epouser un usage metier au debut , ce qui permet de tester les primitive
exemple : le host lan peut etre cree ,  un autre user peut se connecter au lan  

le code que tu a fourni passe a une implementation direct du cas teacher classe mais laisse bcp de point more a debuger en cas d erreur exemple : HubController qui n est pas encore regler 

seul un test du moteur peut permetre d aboutire au implemntation metier de facon sur , iterative et maintenable 

donc le moteur fonctionel est la cible avant le reste 

NB: n envoie pas encore de fichier complet  
l avis de l ia interne sur les usage possible :
Tous les cas d'usage métier possibles
Cas métier    Principe    Faisabilité avec l'architecture actuelle    Limites / Prérequis
1. Séance de classe (teacher)    L'enseignant ouvre le relais pendant le cours ; les élèves scannent le QR pour discuter / poser des questions sans Internet.    ✅ 100 % prêt (c'est le cas conçu dans lan-chat.md).    Nécessite que l'enseignant soit sur l'app native (Tauri) pour lancer le sidecar Rust.
2. Peer-to-peer (DM à 2 sans Internet)    Deux personnes (ex. 2 étudiants ou 2 profs) continuent leur DM hors ligne. L'un génère le QR, l'autre scanne.    ✅ Faisable dès maintenant en passant l'ID du canal DM en sessionId et [dmChannelId] en channels.    L'un des deux doit avoir l'app Tauri (desktop ou mobile) pour héberger le relais. Si l'hôte quitte, le relais coupe.
3. Owner d'un canal / groupe    Le créateur (ADMIN/OWNER) d'un canal privé ou de groupe ouvre une session LAN pour son équipe/club.    ✅ Faisable dès maintenant (même mécanisme, seul le contrôle UI canHost = isOwner change).    Sans --members côté hub, toute personne qui voit le QR peut se connecter (même hors du groupe), mais ses messages seront bloqués/rejetés à la resync serveur.
4. Événement / Réunion / Sortie scolaire    Un encadrant ou organisateur ouvre un relais éphémère sur un Wi-Fi local / partage de connexion (sortie sans 4G, amphi sans réseau).    ✅ Faisable dès maintenant.    Portée limitée au même sous-réseau Wi-Fi / hotspot (pas de traversée NAT/routeur complexe).
5. Salle d'examen / TP isolé    Réseau local volontairement coupé d'Internet : les étudiants échangent uniquement avec le poste prof sur un canal dédié.    ✅ Faisable (c'est même un cas fort du local-first).    Prévoir --members côté hub si on veut empêcher un élève d'usurper l'identité d'un autre en local avant la phase de signature.
6. Maillage multi-relais (mesh sans hôte central)    Les téléphones se relaient les messages de proche en proche (Bluetooth / Wi-Fi Direct) sans aucun hôte.    ❌ Non faisable avec l'architecture actuelle.    Le modèle actuel est étoile (client 
↔
↔ relais WebSocket). Le mesh demanderait un autre transport (BLE / Wi-Fi Direct) et du routage épidémique.
7. Découverte automatique sans QR (mDNS / Bonjour)    L'app détecte automatiquement les séances LAN autour sans scanner de QR.    ⚠️ Partiellement faisable (évolution future).    Demande un service mDNS côté Rust + un choix d'authentification (car sans QR, n'importe qui voit l'annonce et il faut un PIN ou --members).

Réflexion pendant 1 min 15 s

Planning primitives for the engine in sequence.

Outlining engine primitives and the test plan.

Mapping the engine primitives to headless tests.

Reviewing the UI decoupling and engine boundary.

Assessing the trust gap in the relay's membership checks.

Planning the test layers and trust checks.

Splitting the host into engine primitives.

Placing the UI components and the engine boundary.

Reviewing the engine primitives and the staged rollout plan.

Découpage des briques de test avant le code de l'hôte.

Découpage des primitives, dont l'hôte, le jeu de test et la liste des briques.

Découpage de la liste des briques et de l'interface.

Tu as raison : j'ai câblé le cas enseignant avant d'avoir prouvé les primitives. HubController est un bon exemple, parce qu'il mélange trois sujets distincts : lancer le relais, trouver l'adresse du réseau, et reprendre une séance au rechargement. Je pars de ta vision : un moteur sans notion métier, et le métier qui ne fournit que des paramètres.

Les quatre primitives à prouver
Primitive	Entrée	Ce qu'on observe
Héberger	jeton, port, (membres)	un relais joignable, qu'on peut arrêter
Rejoindre	appairage	un statut idle / connecting / connected / closed, avec la raison d'un refus
Échanger	enveloppes	« non vérifié » chez les pairs, historique pour un arrivant tardif, pas de doublon
Appairer	hôte, port, jeton, sessionId	un lien et un objet qui se convertissent, avec refus hors réseau local

Le sessionId reste opaque pour le moteur : le hub ne le lit jamais, et le client le récupère seulement au décodage. Le seul point d'entrée du métier est la liste channels du hello. Classe, DM et propriétaire de canal ne sont donc que trois façons de remplir { sessionId, channels }, et rien dans le moteur ne change entre eux.

Le contrat se limite à ceci :

ts
// moteur : aucune notion métier
interface LanHost {
  start(o: { token: string; port?: number; bind?: string; members?: Record<string, string[]> }): Promise<{ port: number }>
  stop(): Promise<void>
}
type LocalAddresses = () => Promise<string[]> // IPv4 privées candidates, sujet à part

Je retire current() du contrat : reprendre une séance au rechargement relève de l'application, pas du moteur.

Les briques, dans l'ordre
Appairer (tests unitaires purs) : aller-retour lien ↔ objet, refus des hôtes publics, IPv6 et liens mal formés, acceptation de 169.254.x.x.
Héberger : un LanHost de test qui lance le binaire chat-relay depuis Node (il affiche LISTENING addr). Tests : démarrage avec --port 0 --bind 127.0.0.1, arrêt qui libère le port.
Rejoindre : durcir le transport, dont les correctifs ne reposaient jusqu'ici sur aucun test. Raison du refus exposée, exception synchrone d'une page https, détection de silence (ping), rejet non fatal qui ne ferme plus la connexion, start() idempotent. Tests : mauvais jeton donne bad_token et closed sans boucle de reconnexion ; relais arrêté puis relancé donne une reconnexion.
Échanger : deux moteurs réels avec le transport LAN et un faux serveur. Tests : A envoie et B reçoit en « non vérifié » ; B arrive en retard et reçoit l'historique sans renvoi de ce qu'il connaît ; confirmation par le serveur qui retire la copie ; trame invalide d'un pair rejetée ; même id reçu par le LAN puis par le serveur sans doublon. C'est là que passent les correctifs du moteur proposés plus haut (onSent, verrou de flush, receive strict).
Glue applicative : le provider expose l'état du LAN (statut, raison, appairage). Pour le tester, on lui injecte une fabrique de transport (un faux en test).
Composants UI, contrôlés et sans import du moteur. Détail ci-dessous.
LanPanel, la route /local et l'indicateur dans ChatThread.
Hôte natif (Tauri) : implémenter LanHost et la découverte d'adresse, avec des tests manuels sur appareils. Seule cette brique dépend de la plateforme, donc la plus risquée est repoussée jusqu'à ce que 1 à 7 soient prouvées avec l'hôte Node.
Profils métier : classe, DM, propriétaire, chacun produisant { sessionId, channels, canHost, members? }.

L'exemple de ta vision (« un hôte créé, un autre utilisateur s'y connecte ») est atteint dès la brique 4, sans interface ni natif.

Découpage selon ton arborescence
packages/ui reste pur, avec des composants contrôlés : JoinLan reçoit onSubmit(raw): string | null (le message d'erreur) et canScan ; HostLan reçoit link, busy, error, onStart, onStop. lan-status.ts définit sa propre union de statuts au lieu d'importer le type du moteur. Le package n'a alors aucune dépendance au moteur.
apps/web/.../LanPanel.tsx est la colle : il appelle decodePairing, connectLan et useChatSync, et parsePairingInput y déménage. C'est la seule frontière entre moteur et interface.
À nuancer dans l'avis de l'IA interne
« 100 % prêt » pour l'enseignant est exagéré. Le relais et le transport existent, mais l'hôte natif n'existe pas, et personne n'a encore résolu le choix de l'adresse à publier. Une machine a souvent plusieurs interfaces (Wi-Fi, VPN, Docker) : une mauvaise adresse dans le QR produit une connexion qui échoue sans explication.
Cas 3 et 5 (membres) : « bloqués à la resynchronisation » n'est vrai que pour l'outbox de l'intrus. Chez les membres, un message qui n'arrive jamais du serveur n'est jamais confirmé, donc il reste affiché en « non confirmé » jusqu'à la purge de 7 jours. Sans --members ou un contrôle de l'auteur à la réception, un porteur du QR peut polluer un canal pendant une semaine. À trancher à la brique 9, mais à ne pas présenter comme déjà couvert.
Tous les cas exigent un canal déjà existant côté serveur, sinon la resynchronisation refuse tout.
Un défaut trouvé dans le relais, que la brique 2 aurait révélé

start() ne ferme que la boucle d'écoute (quand le HubHandle est abandonné) : les tâches des connexions déjà ouvertes continuent de tourner. Avec un processus tué, tout s'arrête ; avec le relais embarqué comme bibliothèque dans Tauri, un « arrêt » laisserait les clients connectés et bavards. Il faudrait que l'arrêt envoie un Close à chaque client. C'est un argument pour tester l'hôte avant le natif.

Risques terrain à tester tôt
Isolation des clients Wi-Fi : fréquente sur les réseaux scolaires et d'invités, elle bloque tout trafic entre appareils. Un partage de connexion du téléphone de l'enseignant fonctionne en général.
Pare-feu : Windows et macOS demandent une autorisation au premier lancement du relais, ce qui doit être prévu dans le parcours.
Mobile : un sidecar n'est pas possible sur iOS et très limité sur Android. Embarquer le relais en bibliothèque règle Android, mais pas la mise en veille d'iOS.
Deux décisions à acter maintenant
Ton e2e actuel : comment démarre-t-il le relais (binaire compilé en amont, cargo run) et que couvre-t-il déjà ? Si tu m'envoies le fichier, je ne planifie que les cas manquants.
Hôte natif : relais embarqué en bibliothèque (Android possible, demande le correctif d'arrêt) ou sidecar (bureau seulement, arrêt propre) ? Je recommande la bibliothèque, mais les briques 1 à 7 ne changent pas dans les deux cas.

Un point à trancher plus tard, à la brique 8 : le choix de l'adresse (une heuristique ou une liste affichée à l'enseignant).

unit.test.ts
390 lignes
TS
e2e-relay.test.ts
202 lignes
TS

//crates\chat\relay\tests\hub.rs use std::collections::{HashMap, HashSet}; use std::time::Duration; use chat_relay::{start, HubConfig, HubHandle}; use futures_util::{SinkExt, StreamExt}; use serde_json::{json, Value}; use tokio_tungstenite::{connect_async, tungstenite::Message, MaybeTlsStrea

COLLÉ

2-bibliothèque

Choix acté : relais embarqué en bibliothèque. Tes tests couvrent déjà beaucoup de ce que j'avais planifié, donc je n'ajoute que ce qui manque, et le choix de la bibliothèque change deux points.

Ce qui est déjà couvert
Brique	Déjà prouvé
Appairer	aller-retour, hôtes publics refusés, réseaux privés et link-local acceptés, QR invalide
Héberger	protocole du relais : relais sans écho, doublon sans rediffusion, mauvais jeton, non-membre, usurpation d'auteur, historique sans les ids connus, contenu vide ou trop long. HubHandle est Send + Sync : tu avais déjà prévu l'embarquement
Rejoindre	mauvais jeton donne closed sans boucle ; relais tué puis relancé donne reconnexion et renvoi
Échanger	écrire hors ligne, partir à la connexion, arriver chez le pair en « non vérifié », confirmation serveur ; arrivant tardif ; receive strict ; acceptsChannel ; date affichée du pair
Ce que la bibliothèque change
Un vrai stop() devient obligatoire. Aujourd'hui, abandonner le HubHandle arrête seulement l'acceptation de nouvelles connexions. Les tâches des clients déjà connectés continuent : ils restent reliés et échangent encore. Tes tests ne le voient pas, parce qu'ils tuent le processus. Il faut un stop() asynchrone qui ferme chaque client (trame Close) et attend la fin des tâches, avec la même logique dans Drop. Tests Rust : les clients voient la fermeture, aucun message n'est plus relayé, le port est réutilisable, le port occupé renvoie une erreur sans panique.
Un contrat LanHost implémenté deux fois, avec une même suite de tests. Dans le package :
ts
interface LanHost {
  start(o: { token: string; port?: number; bind?: string; members?: Record<string, string[]> }): Promise<{ port: number }>
  stop(): Promise<void>
}

La première implémentation lance le binaire depuis Node (ce que fait déjà ton beforeAll, mais en code jetable à extraire dans un helper). La seconde sera Tauri, appelant la bibliothèque. Une suite hostContract(host) (démarrage, arrêt qui libère le port, double start) tourne sur la première maintenant et sur la seconde à la brique 8. Le choix de l'adresse à publier devient alors un test Rust sur une fonction pure (liste d'interfaces en entrée, candidats en sortie), sans toucher au système.

Ce qui manque, par priorité

Relais (Rust)

Arrêt propre (ci-dessus).
Plafond de taille de message au niveau WebSocket (par défaut 16 Mo : un porteur du jeton peut forcer une allocation avant même le contrôle de max_content_len).
Cas non testés : bad_hello, bad_frame, bad_version, bad_id, l'expiration de 5 s du hello, un message vers un canal non autorisé (not_member sur ingest), l'isolation entre canaux, une liste de canaux partiellement autorisée, l'éviction au-delà de max_backlog.

Transport (TS), sur un faux relais Node
Le vrai relais ne peut pas produire une trame mal formée, un silence prolongé ou un ack retardé. Un faux relais minimal basé sur ws le permet, avec ses limites : il n'est qu'un second relais à tenir à jour, donc je le réserve à ces cas, et la conformité du protocole reste sur le relais réel. Cas à couvrir :

raison du refus exposée (bad_token, not_member) ;
constructeur WebSocket qui lève une exception, comme en page https, donnant insecure_context ;
détection de silence et reconnexion ;
un reject sans id non fatal qui laisse la connexion ouverte ;
start() idempotent, stop() puis start() ;
ack_timeout ;
send hors connexion ;
croissance puis remise à zéro du backoff.

Échanger (e2e)

Échange dans les deux sens et à trois pairs.
Ton test d'arrivant tardif annonce « sans doublon avec ce qu'il connaît », mais Carol arrive avec une inbox vide : il ne prouve pas l'exclusion des ids connus. Il faut un client qui se reconnecte avec son inbox pleine et qui ne reçoit rien de plus (le relais est testé en Rust, l'enchaînement complet non).
Le renvoi des messages en attente respecte l'ordre, et s'arrête au premier échec.

Unitaires

receive : contenu à MAX_CONTENT_LENGTH exactement et au-delà (emoji compris), parentId non UUID, createdAt invalide, authorId trop long, nom d'auteur tronqué, champs inconnus éliminés.
Appairage : IPv6, port 0, paramètres manquants, caractères spéciaux dans sessionId, 0.0.0.0 refusé (c'est l'adresse de liaison du relais : l'encoder par erreur donne un refus générique), localhost accepté (l'enseignant se rejoint par 127.0.0.1).
Risques dans les tests existants
Relais relancé sur le même port juste après le kill : sur Windows, le port peut rester occupé et le test devient instable. Laisse le système choisir un nouveau port, ou réessaie le bind avec un délai.
url globale modifiée dans un test : ça casse si les tests passent un jour en parallèle.
Le binaire doit être compilé en amont : un globalSetup qui lance cargo build -p chat-relay une fois évite l'échec « binaire absent » en CI.
Ordre proposé
Relais : stop() et Drop, plafond de taille, avec leurs tests Rust.
Helper relay-host.ts (première implémentation de LanHost) et le faux relais.
Tests du transport, qui pilotent les correctifs du transport.
Compléments e2e et unitaires.
Seulement ensuite : le provider (statut du LAN), les composants de packages/ui, LanPanel, puis Tauri et les profils métier.

Une seule chose bloque l'étape 3 : les correctifs du transport que je t'avais proposés (raison du refus, exception du constructeur, ping, start() idempotent, rejet non fatal) sont-ils déjà appliqués dans lan-transport.ts ? Tes tests actuels ne les mentionnent pas. S'ils ne le sont pas, les tests viennent en premier et le code suit, ce qui est le bon sens pour ta démarche. Dis-moi aussi si le faux relais en TS te convient, ou si tu préfères tout faire passer par le relais réel.

le tableau de couverture est exact, les compléments sont bien priorisés, et l'observation sur le test de l'arrivant tardif est juste (Carol arrive avec une inbox vide, donc il ne prouve pas l'exclusion des ids connus). ## Amendements 1. **`Drop` annule, il n'attend pas.** `Drop` ne peut pas

COLLÉ

Réflexion pendant 1 min 23 s

Reviewing another instance's amendments against the applied transport fixes.

Evaluating amendments against the planned transport changes.

Évaluation des amendements sur le transport Tauri.

Vérification des affirmations sur le client WebSocket Tauri.

Plafonnement des messages et limites de connexion.

Examen de l'identité déclarée et du champ credential réservé.

Évaluation du spike mobile et de l'adaptateur WebSocket.

Contrat de l'adaptateur WebSocket Tauri.

Vérification de l'état de la connexion pendant la veille.

Writing tests to probe concurrent start and stop races.

Planification des amendements d'identité et de transport.

Évaluation des choix d'identité et du champ sig.

Vérification du plafond de taille et du client Android.

Rédaction du plan d'action final.

Les six amendements tiennent. Je corrige un chiffre de ma part (les défauts de tungstenite sont bien 64 Mio par message et 16 Mio par trame ; la conclusion reste de plafonner via accept_async_with_config) et je précise quelques points.

Amendements : verdict et précisions
Drop annule, stop() attend : accepté. J'ajoute un délai maximal pour stop() (de l'ordre de 2 s) : un client qui ne lit plus ne doit pas le bloquer, donc les tâches restantes sont abandonnées passé ce délai. Trois tests Rust : le chemin stop().await, le chemin Drop (les clients observent la fermeture sans attente), et le client bloqué.
hostContract : accepté. Son périmètre est la sémantique TypeScript (double start, start après stop, port réel retourné pour --port 0). La preuve de l'arrêt est dans les tests Rust, avec le processus de test vivant, et le port doit être relié dans le même processus après stop().
Client WebSocket côté Rust (Tauri) : accepté. Les contraintes à connaître, d'après ce que je sais de la plateforme (à vérifier sur ta version) : sur Windows et Android, la page Tauri peut être servie en https selon un réglage, et alors ws:// est bloqué comme contenu mixte ; sur Android, le trafic non chiffré depuis la WebView est refusé par défaut ; sur iOS, ATS s'applique à la WebView. Une connexion initiée depuis Rust échappe aux trois. Le plugin est piloté par une API à promesse (connect() asynchrone) alors que WebSocketCtor est un constructeur synchrone : l'adaptateur doit faire le pont.
Le « sous-ensemble minimal » existe déjà dans le type WebSocketLike : send, close et quatre gestionnaires. readyState n'est pas utilisé par le transport.
Ce qui manque, c'est un contrat de comportement dont dépend le transport, à vérifier par une suite webSocketCtorContract. Le plus important : onclose doit être appelé exactement une fois, y compris après un échec de connexion. Si un adaptateur n'émet que onerror, la reconnexion ne se déclenche jamais. Autres points : onopen une seule fois, data en chaîne dans onmessage, close() idempotent, gestionnaires posés juste après la construction. La suite tourne sur ws (Node) pour fixer la référence, puis sur un faux du plugin, puis sur appareil.
Identité : accepté, et c'est le point le plus important. hello.userId est une déclaration, donc usurpation_d_auteur_refusee ne protège que des incohérences, pas d'un attaquant, et --members filtre des identités déclarées. Je propose de renommer les tests en ce sens et de réserver credential (optionnel) dans hello. serde ignore déjà les champs inconnus, donc rien ne casse dans un sens ni dans l'autre. À ne pas confondre avec sig : credential authentifie la connexion (un justificatif signé par le serveur et vérifié hors ligne avec une clé publique donnée au relais), sig authentifie le message de bout en bout. Les cas qui en dépendent vraiment sont l'examen et le canal privé ; la séance de classe s'en passe pour un premier usage, le statut « non confirmé » couvrant le faux auteur jusqu'à la confirmation du serveur.
Essai jetable sur appareil : accepté, et placé juste après l'arrêt du relais (brique 1). Je commencerais par un hôte bureau et un téléphone Android : l'installation d'un APK est bien plus simple que la signature iOS, qui viendrait ensuite. L'essai doit répondre à six questions : l'invite « réseau local » d'iOS, l'isolation des clients Wi-Fi, le comportement en arrière-plan, l'adresse retenue dans un QR, la connexion depuis le client Rust, la libération du port à l'arrêt.
Relais : accepté. Plafond de message à quelques dizaines de Kio, exposé dans HubConfig : l'envoi de fichiers changera la configuration, pas le code. J'y ajoute des bornes sur les tableaux du hello (channels, known), absents aujourd'hui. Limite globale de connexions, avec un plafond séparé pour celles qui n'ont pas encore envoyé leur hello (chacune retient une tâche pendant 5 s). Débit par client. Port occupé : une erreur typée (PortInUse) plutôt qu'une io::Error brute, et un test dessus.
Le transport est déjà écrit

Ta recherche confirme que mes correctifs sont en place (insecure_context, l'ensemble FATAL, failure, le ping et la détection de silence, ack_timeout). La brique 3 consiste donc à écrire des tests qui cherchent à casser le code existant, pas à le confirmer. Deux cibles précises :

stop() puis start() pendant que known() est en attente. connect() est asynchrone et ne revérifie que stopped après l'attente. Si start() est rappelé entre-temps, la première connexion reprend et le transport en ouvre une seconde : une socket orpheline reste ouverte et reçoit des trames. La parade est un compteur de génération. À confirmer en collant start, stop et le début de connect.
Échec de connexion sans onclose : c'est la même exigence que le contrat de l'adaptateur, testée ici avec le faux relais.

Quand le relais ajoutera la limitation de débit, un message refusé ne sera renvoyé qu'à la prochaine connexion, car resendPending ne se déclenche que sur la transition vers connected. C'est acceptable (le serveur reste la voie principale), mais à décider.

Ordre mis à jour
Décisions : identité (ci-dessous), valeurs des plafonds.
Relais Rust : stop et Drop, plafonds, limites, port occupé, renommage des tests, cas manquants.
Essai appareil (en parallèle dès que 2 est prêt).
Hôte Node avec hostContract, et faux relais pour les trames mal formées, le silence et l'ack retardé.
Tests du transport, puis compléments e2e et unitaires (dont l'arrivant tardif avec inbox pleine).
Provider, composants de packages/ui, LanPanel, route : seulement après.
Adaptateur Tauri et sa suite de contrat, puis profils métier.

Les contraintes mobiles restent à prévoir pour l'étape 7 : sur iOS, l'hôte doit rester au premier plan (écran allumé), et le message d'explication « réseau local » est obligatoire ; sur Android, héberger écran éteint demande un service de premier plan (petit plugin Kotlin) ; sur Windows et macOS, l'invite du pare-feu au premier lancement.

Je pars sur la version minimale pour l'identité : réserver credential et nommer honnêtement les tests, sans rien vérifier pour l'instant. Tu valides ?

valider avec Amendement 

Amendement 1 : réserver l'identité de l'hôte. C'est peu coûteux et ça supprime le cas le plus grave, sans justificatif :

HubConfig reçoit l'identifiant de l'utilisateur hôte ;
les messages de l'hôte entrent par une API locale du relais (il tourne dans le même processus, grâce au choix de la bibliothèque), pas par une socket ;
un client réseau dont le hello ou les messages portent cet identifiant est refusé (author_reserved).

L'usurpation entre élèves reste possible, mais à ce stade le bon traitement est honnête : afficher l'identité comme « déclarée » dans l'interface, et noter le justificatif signé pour l'examen et les canaux privés, comme il le propose.

Amendement 2 : la limitation de débit ne peut pas perdre un message sur le réseau local. tu l note qu'un message refusé ne repartira qu'à la prochaine connexion, et tu le juge acceptable. Pour la classe hors ligne, il ne l'est pas : le réseau local est alors le seul chemin vers les autres élèves. Un message refusé par rate_limited n'arriverait jamais chez eux tant que personne ne se reconnecte. Deux options, au choix :

le relais renvoie un refus avec un délai (retry_after), et le transport réessaie après ce délai ;
ou le plafond de débit est assez large pour qu'un usage normal (rafales de frappe comprises) ne l'atteigne jamais, et le refus reste réservé aux inondations.

Je prendrais les deux : plafond généreux, plus réessai sur les refus qui disent explicitement « plus tard ». ( a juger a ton niveau)

points :

La course stop() puis start() pendant que known() est en attente :ton diagnostic (un compteur de génération) est le bon : après chaque await, il faut comparer la génération capturée avant l'attente, pas seulement stopped.

tu peux envoyer les fichier

Avant d'écrire du Rust, je regarde si je peux le compiler ici : ce serait la seule vérification fiable de l'arrêt et des plafonds.

bash
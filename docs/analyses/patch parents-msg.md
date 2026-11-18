
Le patch est léger : rien à changer dans `use-realtime-chat`, `reconcile`, les actions ni la validation. Ce sont deux petits fichiers neufs et des retouches ciblées dans cinq fichiers existants.

## Nouveaux fichiers (partagés client et serveur)

```ts
// services/message/constants.ts : ajouter
// Taille de l'aperçu d'une citation : le serveur tronque, le client aussi (parent déjà chargé)
export const REPLY_PREVIEW_MAX_LENGTH = 200
```

```ts
// services/message/preview.ts (nouveau, sans dépendance serveur)
import { REPLY_PREVIEW_MAX_LENGTH } from './constants'

// Array.from : compte en vrais caractères, ne coupe pas un emoji en deux
export function truncatePreview(text: string, max = REPLY_PREVIEW_MAX_LENGTH) {
  const chars = Array.from(text)
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : text
}
```

## 1 et 2. Serveur

**`message.queries.ts`** : la relation, un mapper, et deux lignes de retour.

```ts
import { truncatePreview } from '../preview'

export const messageSelect = {
  // ... champs existants
  // Instantané du parent : permet l'aperçu même s'il est hors de la fenêtre chargée.
  // Nom de la relation auto-référente à adapter à ton schéma.
  parent: {
    select: {
      id: true,
      content: true,
      deletedAt: true,
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} as const satisfies Prisma.MessageSelect

type MessageRow = Prisma.MessageGetPayload<{ select: typeof messageSelect }>

// Le contenu d'un parent supprimé ne sort jamais du serveur ; le reste est tronqué.
export function toMessageDto({ parent, ...message }: MessageRow) {
  return {
    ...message,
    parent: parent && {
      id: parent.id,
      deleted: parent.deletedAt !== null,
      content: parent.deletedAt ? null : truncatePreview(parent.content),
      user: parent.user,
    },
  }
}

// getMessages :       return rows.reverse().map(toMessageDto)
// getOlderMessages :  items: rows.slice(0, limit).reverse().map(toMessageDto)
```

**`message.mutations.ts`** : validation du parent dans `createMessage`, et `updateMessage` renvoie la même forme que les lectures (sinon le cache recevrait un `parent` brut après une édition).

```ts
export async function createMessage({ orgId, ...data }: CreateMessageOutput & { userId: string; orgId: string }) {
  // Réponse : le parent doit exister dans le MÊME canal (donc la même organisation) et ne pas
  // être supprimé. Un rejeu légitime passe d'abord : sinon le retry d'une réponse dont le parent
  // a été supprimé entre-temps serait rejeté alors que le message est déjà en base.
  if (data.parentId) {
    const parentCount = await prisma.message.count({
      where: { id: data.parentId, channelId: data.channelId, deletedAt: null },
    })
    if (parentCount === 0) {
      const alreadyCreated = await prisma.message.count({
        where: { id: data.id, userId: data.userId, channelId: data.channelId },
      })
      if (alreadyCreated > 0) return { id: data.id, created: false }
      // Code et message à adapter à tes constantes existantes
      throw new AppError({ message: ERRORS.NOT_FOUND, code: ERROR_CODES.NOT_FOUND })
    }
  }

  // ... reste inchangé (createMany skipDuplicates, etc.)
}

export async function updateMessage(messageId: string, userId: string, data: UpdateMessageDataOutput) {
  const row = await tryConstraint(prisma.message.update({ /* ... inchangé ... */ }))
  return toMessageDto(row)
}
```

## 3. Client : types et résolution du parent

```ts
// hooks/chat/types.ts
export type ReplyPreview = {
  id: string
  authorName: string | null // null = inconnu
  content: string | null // null = supprimé ou indisponible
  state: 'available' | 'deleted' | 'unknown'
}

export type ChatMessage = RealtimeMessage & {
  isOwn: boolean
  status: MessageStatus
  replyTo: ReplyPreview | null
}
```

```ts
// hooks/chat/utils.ts : ajouter (resolveReplyTo est pure, donc testable)
import { truncatePreview } from '@/services/message/preview'
import type { ReplyPreview } from './types'

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
    return { id: parentId, authorName: loaded?.user.name ?? snapshot?.authorName ?? null, content: null, state: 'deleted' }
  }
  // 1. Parent chargé : version la plus fraîche (éditions comprises)
  if (loaded) {
    return { id: parentId, authorName: loaded.user.name, content: truncatePreview(loaded.content), state: 'available' }
  }
  // 2. Instantané serveur (parent hors fenêtre, ou supprimé côté serveur)
  if (snapshot) return snapshot
  // 3. Rien
  return { id: parentId, authorName: null, content: null, state: 'unknown' }
}
```

## 4. `useChat.ts`

```ts
import { toast } from 'sonner'
import { mapMessages, mapReplySnapshots, resolveReplyTo } from '@/hooks/chat/utils'
import { truncatePreview } from '@/services/message/preview'
import type { ChatMessage, OutboxDraft, OutboxEntry, ReplyPreview } from '@/hooks/chat/types'

// REMPLACE useState(replyToId). Le canal est mémorisé : une réponse commencée dans un autre
// canal est ignorée et ne part jamais avec un parent étranger.
const [replyTarget, setReplyTarget] = useState<{ id: string; channelId: string } | null>(null)
const replyToId = replyTarget?.channelId === channelId ? replyTarget.id : null
```

La fusion se scinde en deux passes, parce que le parent doit être retrouvé avant le filtre des suppressions. Remplace la fin du `useMemo` (à partir du `return [...merged.values()]`) :

```ts
const snapshots = mapReplySnapshots(data?.items)

// Éditions appliquées AVANT le filtre : un parent supprimé garde ainsi son auteur connu
const patched = [...merged.values()].map((message) => {
  const patch = patches[message.id]
  return patch && (!message.editedAt || message.editedAt < patch.editedAt)
    ? { ...message, content: patch.content, editedAt: patch.editedAt }
    : message
})
const loadedById = new Map(patched.map((message) => [message.id, message]))

return patched
  .filter((message) => !deletedIds.has(message.id))
  .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  .map((message) => ({
    ...message,
    isOwn: !!user?.id && message.user.id === user.id,
    status: outbox[message.id]?.status ?? 'sent',
    replyTo: resolveReplyTo(message.parentId, loadedById, snapshots, deletedIds),
  }))
```

La composition d'une réponse, qui remplace l'ancien `replyToId` / `setReplyToId` :

```ts
// Aperçu du bandeau : dérivé des messages affichés, donc à jour si le parent est édité
const replyingTo = useMemo<ReplyPreview | null>(() => {
  const target = replyToId ? messages.find((m) => m.id === replyToId) : undefined
  return target
    ? { id: target.id, authorName: target.user.name, content: truncatePreview(target.content), state: 'available' }
    : null
}, [replyToId, messages])

const startReply = useCallback(
  (messageId: string) => {
    // Seul un message confirmé en base peut être cité : le serveur refuse un parent inexistant
    if (messages.find((m) => m.id === messageId)?.status !== 'sent') return
    setReplyTarget({ id: messageId, channelId })
  },
  [messages, channelId]
)

const cancelReply = useCallback(() => setReplyTarget(null), [])

// Parent supprimé pendant la rédaction : on abandonne la réponse plutôt que de la laisser échouer
useEffect(() => {
  if (!replyTarget) return
  if (replyTarget.channelId !== channelId) return setReplyTarget(null) // changement de canal : silencieux
  if (!messages.some((m) => m.id === replyTarget.id)) {
    setReplyTarget(null)
    toast.info("Le message auquel vous répondiez n'est plus disponible")
  }
}, [replyTarget, channelId, messages])
```

Dans `sendMessage`, remplace `setReplyToId(null)` par `setReplyTarget(null)` (le `parentId: replyToId` du brouillon reste valable). Dans le `return`, remplace `replyToId, setReplyToId` par `replyingTo, startReply, cancelReply`, et ajoute `jumpToMessage: loadUntil` dans la section Historique (voir le point 5).

## 5. Aller au message d'origine (`useOlderMessages.ts`)

On factorise le chargement d'une page, puis `loadUntil` boucle au plus 5 fois, en gardant la fenêtre contiguë :

```ts
// Charge UNE page antérieure au curseur et l'injecte dans le cache. null si rien n'a été ajouté.
const fetchPage = useCallback(
  async (cursor: Dto) => {
    const res = await getOlderMessagesAction({
      channelId,
      before: { createdAt: new Date(cursor.createdAt).toISOString(), id: cursor.id },
    })
    if (!('data' in res) || !res.data) {
      toast.error(('error' in res && res.error) || 'Impossible de charger les messages précédents')
      return null
    }
    const { items: older, hasMore: more } = res.data
    let applied = false as boolean
    updateItems((current) => {
      applied = current.some((m) => m.id === cursor.id) // curseur disparu : page ignorée, pas de trou
      return applied ? mergeItemsById(older, current) : current
    })
    if (!applied) return null
    if (!more) setExhaustedAt(older[0]?.id ?? cursor.id)
    return res.data
  },
  [channelId, updateItems]
)

// Une seule opération de chargement à la fois
const run = useCallback(async <R>(task: () => Promise<R>, fallback: R): Promise<R> => {
  if (loadingRef.current) return fallback
  loadingRef.current = true
  setIsLoadingOlder(true)
  try {
    return await task()
  } finally {
    loadingRef.current = false
    setIsLoadingOlder(false)
  }
}, [])

const loadOlder = useCallback(async () => {
  if (!hasMore || !oldest) return
  await run(() => fetchPage(oldest), null)
}, [hasMore, oldest, run, fetchPage])

// true = le message est maintenant en cache. 5 pages au plus (250 messages) : au-delà, « trop ancien ».
const loadUntil = useCallback(
  async (messageId: string, maxPages = 5): Promise<boolean> => {
    if (items.some((m) => m.id === messageId)) return true
    if (!hasMore || !oldest) return false
    return run(async () => {
      let cursor: Dto = oldest
      for (let page = 0; page < maxPages; page++) {
        const result = await fetchPage(cursor)
        if (!result) return false
        if (result.items.some((m) => m.id === messageId)) return true
        if (!result.hasMore || !result.items[0]) return false
        cursor = result.items[0]
      }
      return false
    }, false)
  },
  [items, hasMore, oldest, run, fetchPage]
)

return { hasMore, loadOlder, loadUntil, isLoadingOlder }
```

Dans `useChat`, ajoute `loadUntil` à la destructuration de `useMessages`. Côté UI : si `jumpToMessage(id)` renvoie `true`, on défile jusqu'à l'élément après le rendu, et sinon on affiche « message trop ancien ».

## À vérifier

- **Schéma Prisma** : l'existence de la relation auto-référente (`parent`, avec `parentId` en clé étrangère). et me l indiquer ne pas l ajouter silencieusement 

- **Test `reconcile.test.ts`** : l'helper `createMsg` doit ajouter `parent: null` pour compiler.
- **`getMessageById`** utilise `messageSelect` et fait maintenant une jointure inutile pour la policy. Tu peux lui donner un `select` minimal.
- **Constantes d'erreur** : `ERRORS.NOT_FOUND` et `ERROR_CODES.NOT_FOUND` sont des suppositions.
- **Un retry qui ne peut plus réussir** : si le parent d'une réponse en échec est supprimé avant le retry, le serveur la refusera à chaque tentative. C'est correct côté données, mais l'UI devrait proposer  << message indisponible >> (retry avec `parentId: null`). Je ne l'ai pas inclus ici ; on le traitera apres

- **Ordre de déploiement** : le serveur d'abord. Le client tolère l'absence de `parent` et retombe sur le parent chargé, ou sur « message indisponible ».

Un test de `resolveReplyTo` couvrirait quatre cas : parent chargé (avec une édition), parent supprimé en direct, parent connu seulement par l'instantané, parent inconnu. Je peux le rédiger. Et si tu veux, je peux aussi traiter l'étape 6, la notification dédiée à l'auteur du parent.
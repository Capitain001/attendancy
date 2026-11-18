on passe au point 4, l'édition et la suppression en temps réel

## État actuel

- Chez l'auteur, `update` et `delete` passent par `useCrudEntity`, donc par `applyPayload` : son cache est correct.
- Chez les **autres**, rien ne bouge. Le seul événement broadcast est « nouveau message », donc une édition ou une suppression n'apparaît qu'au prochain refetch. Or `refetchOnWindowFocus` est à `false` et `staleTime` est de 30 s : ça peut durer longtemps.

## Proposition : deux événements broadcast et une surcouche locale

**Protocole.** Même invariant que pour la création : l'acteur diffuse **après** le succès serveur, donc personne ne voit une modification qui n'existe pas en base.

```ts
// use-realtime-chat.ts
const EVENT_UPDATE = 'message:update' // { id, content, editedAt }
const EVENT_DELETE = 'message:delete' // { id }
```

**Côté récepteur.** Le hook garde deux petites structures, réinitialisées avec le reste dans le nettoyage de l'effet :

```ts
type MessagePatch = { content: string; editedAt: string }
const [patches, setPatches] = useState<Record<string, MessagePatch>>({})
const [deletedIds, setDeletedIds] = useState<ReadonlySet<string>>(new Set())

// réception : le plus récent gagne (comparaison ISO), la suppression est définitive
.on('broadcast', { event: EVENT_UPDATE }, ({ payload }) => setPatches((cur) =>
  !cur[payload.id] || cur[payload.id].editedAt < payload.editedAt
    ? { ...cur, [payload.id]: { content: payload.content, editedAt: payload.editedAt } }
    : cur))
.on('broadcast', { event: EVENT_DELETE }, ({ payload }) =>
  setDeletedIds((cur) => new Set(cur).add(payload.id)))
```

`useChat` applique cette surcouche dans la fusion existante, après la `Map` :

```ts
.filter((m) => !deletedIds.has(m.id))
.map((m) => {
  const p = patches[m.id]
  return p && (!m.editedAt || m.editedAt < p.editedAt)
    ? { ...m, content: p.content, editedAt: p.editedAt }
    : m
})
```

Côté auteur, `useChat` expose `editMessage(id, content)` et `deleteMessage(id)`. Chacun fait `await` de la mutation, puis diffuse l'événement. Si la mutation lève une exception, il n'y a pas de diffusion : le toast d'erreur est déjà affiché par `useCrudEntity`.

**Pourquoi une surcouche plutôt que d'écrire dans le cache React Query à la réception**

- Un message reçu uniquement en broadcast n'est pas dans le cache. Or  `applyPayload("UPDATE")` fait `newById = { ...currentById, [id]: merged }` sans vérifier que l'id existe dans `items` : il laisserait un enregistrement partiel `{ id, content }` dans `byId`.
- Un message supprimé qui vit encore dans `realtimeMessages` réapparaîtrait après son retrait du cache, puisque la fusion le reprend.
- La surcouche couvre toutes les sources (cache, temps réel, pages antérieures) de la même façon. C'est ce qui règle la question des pages antérieures : un message supprimé hors de la fenêtre des 50 reste dans le cache jusqu'au rechargement, et la pierre tombale le masque.
- Au refetch, le serveur redevient la vérité, et la surcouche, cohérente avec lui, ne gêne pas.

**Reconnexion.** Les événements manqués pendant une coupure sont perdus. À chaque `SUBSCRIBED` autre que le premier, `useChat` appelle `refetch()`, et `reconcileMessages` remet la fenêtre récente à jour. Les pages plus anciennes restent périmées jusqu'au rechargement, ce qui me semble acceptable.

## À trancher 

**1. Un champ `editedAt`.** Pour afficher « modifié », `updatedAt > createdAt` ne marche pas : `createdAt` vient du client (policy R3) alors que `updatedAt` est posé par le serveur, donc ils diffèrent dès la création. Il faut un `editedAt DateTime?` renseigné uniquement par l'update, exposé dans `messageSelect` et le DTO. Il sert aussi de version pour départager deux éditions croisées. 

**2. Le retour de `updateMessageAction`.** Il faut que l'édition renvoie le `editedAt` posé par le serveur, pour qu'il parte tel quel dans le broadcast. Sinon, on utiliserais l'heure du client, moins fiable.

**3. Le niveau de confiance des broadcasts.** Un message broadcast n'est pas authentifié : un membre du canal peut diffuser une fausse suppression ou une fausse édition, comme il peut déjà diffuser un faux message. L'effet reste local et temporaire (le refetch corrige). Deux niveaux possibles :
- **a) Affichage seulement, corrigé au refetch.** C'est cohérent avec ce que fait déjà le broadcast de création, et c'est ma recommandation pour un chat interne.
- **b) Vérification serveur par événement** : le récepteur relit le message depuis le serveur avant d'appliquer. C'est plus sûr, mais chaque édition coûte une requête par client connecté. À considérer plutôt avec des canaux privés Supabase et des règles RLS sur le broadcast.


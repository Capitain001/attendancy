# Proposition : `useMessages` par canal

> Document de proposition uniquement. Aucun fichier source n'est modifié par ce
> document. Les changements de code attendent une validation explicite.

## Constat vérifié

- `useMessages` reçoit maintenant un `channelId`, mais passe actuellement cette
  chaîne à `getMessagesAction`.
- `getMessagesAction` attend un objet `{ channelId }`, validé par
  `getMessagesSchema`.
- Le type `GetMessagesDto[number]` représente bien un message individuel et
  satisfait le contrat de `useCrudEntity`.
- L'exemple du hook ne fournit pas `id`, pourtant obligatoire à la création
  selon le schéma `message`.
- `useChat` calcule déjà `createdAt`, mais ne le passe ni à l'envoi temps réel,
  ni à l'action de persistance.
- `useEntity` construit actuellement sa clé avec
  `[entityName, initialParams].filter(Boolean)`. `useCrudEntity` n'expose pas
  encore `initialParams`.

## Changements proposés

### 1. `apps/web/src/hooks/data/chat/useMessages.ts`

Corriger l'argument de fetch :

```diff
- const fetchFn = toFetchFn(getMessagesAction, channelId);
+ const fetchFn = toFetchFn(getMessagesAction, { channelId });
```

Remplacer la clé `entityName` construite avec interpolation et fournir le
paramètre initial :

```diff
- entityName: `messages:${channelId}`,
+ entityName: "messages",
+ initialParams: { channelId },
```

La clé React Query obtenue sera exactement
`["messages", { channelId: "<UUID>" }]`. Elle isole le cache par canal et
réutilise la construction déjà présente dans `useEntity`.

Actualiser le JSDoc : parler de messages d'un canal, remplacer l'exemple
`"channelId_uuid"` par un UUID valide, et inclure l'`id` obligatoire dans
l'exemple `create`. L'exemple peut aussi fournir `createdAt`, facultatif dans le
schéma et créé côté client pour partager le même horodatage entre affichage et
persistance.

Le type générique reste :

```ts
useCrudEntity<GetMessagesDto[number], CreateMessageInput, UpdateMessageDataInput>
```

Il est correct : le hook travaille sur chaque message, tandis que le fetch
retourne une collection de ces messages.

### 2. `apps/web/src/hooks/entity/useCrudEntity.ts`

Importer le type déjà utilisé par `useEntity` :

```ts
import type { EntityParams } from "./types";
```

Exposer `initialParams` dans `UseCrudEntityOptions` :

```ts
initialParams?: EntityParams;
```

`useCrudEntity` transmet déjà les options restantes à `useEntity` via
`...entityOptions`; aucune autre modification de ce hook générique n'est
nécessaire.

### 3. `apps/web/src/hooks/chat/useChat.ts`

Le commentaire de création doit indiquer que l'id et l'horodatage sont partagés
entre les deux voies. Transmettre la valeur existante `createdAt` :

```ts
sendRealtimeMessage(messageContent, messageId, createdAt);

persistMessage({
  id: messageId,
  createdAt,
  content: messageContent,
  channelId,
});
```

### 4. `apps/web/src/hooks/chat/use-realtime-chat.ts`

Rendre `id` et `createdAt` obligatoires dans la signature de `sendMessage`, puis
utiliser le `createdAt` reçu au lieu d'appeler `new Date()` dans ce hook :

```ts
async (content: string, id: string, createdAt: string) => {
  // ...
  const message: ChatMessage = {
    id,
    content,
    user: { name: userName },
    createdAt,
  };
}
```

Le seul appel trouvé à `sendRealtimeMessage` est dans `useChat`; il sera mis à
jour en même temps.

## Forme exacte de la clé de cache

La proposition ci-dessus produit `["messages", { channelId }]`, pas exactement
`["messages", channelId]`. La clé reste déterminée par l'id du canal et permet
le même isolement. Obtenir exactement le tuple avec une chaîne comme second
élément demanderait une nouvelle option de clé dans `useEntity` et
`useCrudEntity`, à intégrer aussi avec `refetchWithParams` et les mutations de
cache. Cette extension n'est pas incluse dans la proposition minimale.

## Vérification après validation

Après accord, lancer le contrôle TypeScript de l'application web et le lint
ciblé sur les quatre fichiers. Les erreurs TypeScript préexistantes seront
distinguées des erreurs éventuellement introduites par ces changements.

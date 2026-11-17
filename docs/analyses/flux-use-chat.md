# Analyse du flux `useChat` et pistes de séparation

Cette analyse décrit le comportement observé dans le code au 17 novembre 2026.
Elle documente le flux et propose un découpage; elle ne modifie aucun hook ni
service.

## Limite du traçage amont

La recherche dans le dépôt ne trouve aucun appel à `useChat()`. Le hook est
déclaré dans [`useChat.ts`](../../apps/web/src/hooks/chat/useChat.ts), mais
[`hooks/chat/index.ts`](../../apps/web/src/hooks/chat/index.ts) ne le réexporte
pas. Il est donc impossible de confirmer ici quel composant fournit `channelId`
et `user`, quel formulaire appelle `sendMessage`, ou qui consomme `onMessage`.

Le flux documentable commence à l'API du hook :

```text
consommateur non identifié
  -> useChat({ channelId, user?, onMessage? })
      -> useMessages(channelId)       -> actions serveur message
      -> useRealtimeChat(channelId)   -> Supabase broadcast + presence
```

Il faudra retrouver ou valider le consommateur attendu avant de considérer ce
flux comme livré de bout en bout.

## Flux étape par étape

### 1. Entrées et état local

`useChat` reçoit un identifiant de canal, un utilisateur optionnel et un
callback optionnel. Il gère localement le texte en cours, les participants et
l'état « notifications muettes ».

Sans `user.id` au premier montage, `useRealtimeChat` ne crée pas de canal
Supabase; `isConnected` reste alors faux et l'envoi est bloqué, même si les
messages persistés peuvent encore être chargés par `useMessages`. Si l'identité
disparaît après une connexion, le hook ne remet pas explicitement
`isConnected` à `false` dans le nettoyage : cette transition est à vérifier si
les props peuvent changer ainsi.

### 2. Chargement et mutations persistés

[`useMessages.ts`](../../apps/web/src/hooks/data/chat/useMessages.ts) reçoit le
même `channelId`. Il adapte `getMessagesAction` et `createMessageAction`, puis
configure [`useCrudEntity`](../../apps/web/src/hooks/entity/useCrudEntity.ts)
avec [`messageEntityPatch`](../../apps/web/src/hooks/data/chat/utils.ts).

- La lecture appelle l'action de `services/message`, qui authentifie
  l'utilisateur, vérifie son appartenance au canal et retourne les messages.
- À la création, le hook envoie au serveur l'`id`, `createdAt`, le contenu et le
  canal. L'identité et l'organisation sont résolues côté serveur.
- La base renvoie seulement `{ id, created }`. Après succès,
  `useCrudEntity` combine les valeurs par défaut, le patch dérivé des variables
  d'entrée, puis la réponse serveur. Le patch ajoute notamment `createdAt` sous
  forme de `Date`, nécessaire au mapping persisté.

### 3. Connexion temps réel et présence

[`use-realtime-chat.ts`](../../apps/web/src/hooks/chat/use-realtime-chat.ts)
crée un canal Supabase portant le nom du canal métier. Une seule souscription
gère deux flux :

- **Broadcast de message** : le payload reçu est ajouté à `realtimeMessages`.
- **Présence** : les utilisateurs sont regroupés par `user.id`; si plusieurs
  appareils représentent la même personne, l'entrée avec le `online_at` le plus
  récent est conservée.

À la souscription, le hook publie l'utilisateur dans la présence. Au démontage
ou au changement de dépendances, il se désabonne et supprime le canal.

### 4. Fusion des messages pour l'affichage

Dans `useChat`, les messages persistés sont transformés par
[`mapMessages`](../../apps/web/src/hooks/chat/utils.ts) : la date `Date` devient
une chaîne ISO, et le prénom/nom deviennent le nom affiché. Ils sont ensuite
concaténés avec les messages temps réel.

La liste est dédupliquée par `id`. Comme les persistés sont placés en premier,
leur version est conservée lorsqu'un message existe dans les deux sources.
Enfin, les messages sont triés par leur date ISO.

### 5. Participants, utilisateurs connectés et mentions

Les participants du canal sont chargés séparément via
[`getRoomParticipantsAction`](../../apps/web/src/services/chat/actions/message.queries.ts)
dans `services/chat` (distinct des actions de messages, dans
`services/message`). L'action authentifie l'utilisateur et vérifie aussi son
appartenance au canal. Un indicateur `cancelled` empêche de mettre à jour l'état
après démontage ou changement de canal.

Le hook construit ensuite deux ensembles distincts :

- `participants` fournit le répertoire des personnes pouvant être mentionnées,
  y compris celles qui ne sont pas connectées.
- `connectedUsers` vient de la présence Supabase; `otherUsers` retire
  l'utilisateur courant.

Le répertoire de mentions ajoute deux clés par nom : le premier prénom/mot et
le nom complet sans espaces. Le contenu est normalisé (accents, casse et
caractères non acceptés), puis `@handle` est extrait par expression régulière.
Les cibles sont dédupliquées par identifiant et l'auteur est exclu.

### 6. Préférence « muet »

La préférence est stockée dans `localStorage` sous une clé contenant
`channelId`. Un effet la relit lorsque le canal change; `toggleMute` met à jour
à la fois l'état React et le stockage local.

### 7. Envoi d'un message

`sendMessage` suit cet ordre :

1. Empêche la soumission HTML par défaut.
2. Refuse un texte vide ou un envoi si la connexion temps réel n'est pas prête.
3. Crée un UUID et un horodatage ISO une seule fois; nettoie le texte.
4. Passe le même `id`, `createdAt` et contenu à `sendRealtimeMessage` et à
   `persistMessage`.
5. Lance l'envoi des notifications.
6. Vide immédiatement le champ.

Le hook temps réel construit un `ChatMessage` à partir de l'objet reçu, l'ajoute
à l'état local, puis envoie ce même objet au broadcast. La persistance crée sa
propre mutation de cache. Le `id` commun permet à la fusion de supprimer le
doublon.

Ces opérations ne sont pas séquencées par des `await` dans `useChat` :
l'interface vide le champ sans attendre le résultat du broadcast, de la
persistance ou des notifications. Le broadcast est tenté avant la persistance,
mais cela ne constitue pas une transaction commune.

### 8. Notifications

`sendNotifications` s'arrête si le canal est muet ou si aucun autre utilisateur
n'est connecté. Si le texte contient au moins une mention résolue, les notifications ciblent
ces participants, même s'ils ne sont pas connectés; sinon elles ciblent les
utilisateurs connectés. Chaque envoi est lancé avec `Promise.allSettled`, mais
les résultats individuels ne sont pas inspectés.

**Frontière à corriger avant de considérer cette partie sûre :** le module
client `useChat.ts` importe directement
[`sendPushNotificationToUserById`](../../apps/web/src/services/notification/push.ts)
depuis `services/notification/push.ts`. Cette fonction est documentée comme interne
au serveur, sans authentification propre, et accède à la persistance et aux
abonnements push. Elle ne devrait pas être appelée directement depuis un hook
client. Le flux doit passer par une action serveur authentifiée qui valide le
canal et les destinataires.

### 9. Callback parent et API retournée

Un effet appelle `onMessage(messages)` après un changement de la liste des
messages ou de la référence du callback. Le hook expose ensuite l'état du
formulaire, les messages, la connexion, les utilisateurs, les participants,
l'état muet et ses actions.

## Séparations de responsabilités proposées

À appliquer progressivement, après identification du consommateur amont :

| Responsabilité actuelle | Découpage proposé | Bénéfice / limite |
| --- | --- | --- |
| Fusion, déduplication et tri dans le `useMemo` | Fonction pure `mergeChatMessages` dans `hooks/chat/utils.ts`, avec tests unitaires | Rend explicite la priorité persisté/temps réel et testable le tri. |
| Normalisation, indexation et résolution des mentions | Petit module pur `hooks/chat/mentions.ts` | Sépare l'algorithme de mention de l'état React; permet de tester accents, alias, doublons et auteur exclu. |
| Lecture/écriture de `localStorage` et état muet | Hook `useChatMutePreference(channelId)` | Isole le cycle de vie navigateur et la préférence par canal. |
| Chargement des participants et erreurs de l'action | Hook de données sous `hooks/data/chat/` | Centralise le chargement, l'état d'erreur et l'annulation selon le pattern de données du projet. Actuellement, `response.data ?? []` peut faire passer une réponse `{ error }` pour une liste vide. |
| Résolution des destinataires et envoi push | Action serveur authentifiée dans le service notification, avec validation serveur du canal/destinataires | Corrige la frontière client/serveur; le client ne doit pas invoquer la fonction interne sans auth. |
| Présence et broadcast dans `useRealtimeChat` | Garder un seul propriétaire du canal Supabase; extraire d'abord les transformations pures de présence si elles grossissent | Évite deux hooks qui ouvriraient chacun une souscription indépendante au même canal. |
| Coordination de l'envoi dans `useChat` | Garder `useChat` comme orchestrateur UI; envisager un hook de mutation dédié seulement après avoir retrouvé le consommateur et défini le comportement d'erreur | Évite de déplacer prématurément une orchestration dont l'API amont n'est pas connue. |

## Ordre de travail recommandé

1. Identifier ou valider le consommateur de `useChat` et l'origine de
   `channelId`, `user` et `onMessage`.
2. Traiter la frontière serveur des notifications avant d'exposer ou de
   considérer fonctionnel l'envoi push client.
3. Extraire les fonctions pures de fusion et de résolution des mentions, puis
   les tester sans React.
4. Isoler la préférence muette et le chargement des participants si ces
   responsabilités restent utilisées par le consommateur identifié.
5. Enfin, décider si l'orchestration d'envoi mérite un hook dédié et définir
   explicitement les erreurs, l'attente de persistance et le comportement du
   champ après échec.

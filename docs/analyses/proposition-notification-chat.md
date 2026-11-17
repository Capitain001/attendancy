# Notifier aussi les membres déconnectés du chat

> Proposition d'analyse, pas une implémentation.

## Objectif et flux

À chaque message, **notifier aussi les membres du canal absents de la présence
temps réel**. Le mécanisme d'envoi existe déjà; le changement est d'identifier
ces membres et de les inclure dans les destinataires envoyés.

```text
getRoomParticipantsAction -> IDs des membres ─┐
                                              ├-> IDs absents
useRealtimeChat -> IDs présents ──────────────┘
sendMessage -> sendNotifications -> destinataires existants + absents
             -> sendPushNotificationToUserById pour chaque destinataire
```

## Données déjà disponibles

- **Participants du canal** : [`useChat`](../../apps/web/src/hooks/chat/useChat.ts)
  appelle `getRoomParticipantsAction(channelId)`. Cette action authentifie
  l'appelant, vérifie son appartenance au canal, puis appelle
  [`getRoomParticipants`](../../apps/web/src/services/chat/database/message.queries.ts).
  Le contrôle et le retour sont :

```ts
const { user, orgId } = auth.data
if (!(await isChannelMember({ channelId, userId: user.id, orgId }))) {
  return { error: 'Accès refusé au canal' }
}
return { data: await getRoomParticipants(channelId) }
```

  La requête Prisma reçoit le `channelId` et sélectionne :

```ts
return prisma.channelMember.findMany({
  where: { channelId },
  select: {
    role: true,
    joinedAt: true,
    user: {
      select: { id: true, firstName: true, lastName: true, avatar_url: true },
    },
  },
})
```

  Chaque résultat contient donc `role`, `joinedAt` et `user` avec les champs
  `id`, `firstName`, `lastName` et `avatar_url`. Le type client
  `ChatRoomParticipant` est dérivé du retour réel de cette requête dans
  [`types.ts`](../../apps/web/src/services/chat/types.ts).

- **Utilisateurs présents** : [`useRealtimeChat`](../../apps/web/src/hooks/chat/use-realtime-chat.ts)
  s'abonne au canal Supabase dont le nom est `channelId`. À chaque événement
  `presence: sync`, il lit `presenceState<PresenceUser>()`, groupe les entrées
  par `user.id` et conserve la connexion au `online_at` le plus récent.
  `connectedUsers` est un `Record<string, PresenceUser>` indexé par ID.

  La source des valeurs est cet appel à l'API Presence de Supabase :

```ts
const newState = newChannel.presenceState<PresenceUser>()
const usersByUserId = new Map<string, PresenceUser>()

Object.entries(newState).forEach(([, values]) => {
  const userInfo: PresenceUser = values[0]
  if (!userInfo?.id) return

  const existingUser = usersByUserId.get(userInfo.id)
  if (!existingUser) {
    usersByUserId.set(userInfo.id, userInfo)
    return
  }

  const existingTime = existingUser.online_at
    ? new Date(existingUser.online_at).getTime()
    : 0
  const newTime = userInfo.online_at
    ? new Date(userInfo.online_at).getTime()
    : 0
  if (newTime > existingTime) usersByUserId.set(userInfo.id, userInfo)
})

const newUsers = Object.fromEntries(usersByUserId) as Record<string, PresenceUser>
setConnectedUsers(newUsers)
```

  Le code actuel compare déjà `online_at` avant de remplacer une entrée, pour
  garder la connexion la plus récente lorsque le même utilisateur a plusieurs
  appareils connectés.

  Le payload transmis à Presence contient actuellement :

```ts
{
  id: user.id
  name: user.name
  email: user.email
  role: user.role
  avatar_url: user.avatar_url
  function: user.function
  status: user.status
  online_at: new Date().toISOString()
}
```

  Le type [`PresenceUser`](../../apps/web/src/types/user.ts) autorise aussi
  `organization`, mais le payload `track` ci-dessus ne l'envoie pas. Pour
  identifier les absents, le seul champ nécessaire de Presence est `id`.

Ces deux listes sont déjà chargées par le hook :

```ts
const [participants, setParticipants] = useState<ChatRoomParticipant[]>([])
const { connectedUsers } = useRealtimeChat({ channelId, user })

const response = await getRoomParticipantsAction(channelId)
setParticipants(response.data ?? [])
```

Il n'est donc pas nécessaire d'ajouter une nouvelle requête de membres. La
présence est une source distincte de la base : elle indique quels IDs sont
actuellement trackés sur le canal Supabase. Dans le code actuel,
`response.data ?? []` transforme aussi une réponse `{ error }` en liste vide;
le calcul proposé doit donc attendre une réponse `{ data }` réussie, et non
prendre cette valeur vide pour une preuve qu'il n'y a pas de membres.

## Identification

Le calcul doit retourner `null` tant que les données ne permettent pas encore
de conclure. Une liste vide signifie alors réellement « aucun membre déconnecté »
et non « les données ne sont pas prêtes » :

```ts
const offlineRecipientIds = useMemo(() => {
  if (!participantsLoaded || !presenceSynced || !user?.id) return null

  const connectedIds = new Set(
    Object.values(connectedUsers).flatMap(({ id }) => (id ? [id] : [])),
  )

  return participants
    .map(({ user: participant }) => participant.id)
    .filter((id) => id !== user.id && !connectedIds.has(id))
}, [participantsLoaded, presenceSynced, participants, connectedUsers, user?.id])
```

Le résultat est la différence `membres du canal - utilisateurs présents -
auteur`. Seule cette liste d'identifiants est le résultat de la problématique;
le système de notification existant reste inchangé.

## Prérequis : attendre la synchronisation Presence

`connectedUsers` est initialisé à `{}` dans `useRealtimeChat` et n'est alimenté
qu'à la réception de l'événement Supabase `presence: sync`. `isConnected` passe
à `true` dès l'état `SUBSCRIBED`, avant que le code n'indique que cette première
synchronisation a eu lieu.

Il faut donc distinguer « présence synchronisée, aucun autre membre en ligne »
de « présence pas encore synchronisée ». Sinon, au premier rendu, tous les
membres pourraient être classés à tort comme déconnectés.

La modification proposée à `useRealtimeChat` est limitée aux ajouts suivants
dans le code existant :

```ts
const [presenceSynced, setPresenceSynced] = useState(false)

useEffect(() => {
  // Au début de chaque connexion/canal, l'état n'est pas encore connu.
  setPresenceSynced(false)
  // ...création et souscription au canal déjà présentes...
}, [channelId, presenceKey, user, userName, supabase])

// Dans le callback presence: sync existant, après setConnectedUsers(newUsers) :
setPresenceSynced(true)

// Dans la branche existante où le statut n'est pas SUBSCRIBED :
setPresenceSynced(false)
setConnectedUsers({})

// Dans l'objet retourné par useRealtimeChat :
return { messages, sendMessage, isConnected, connectedUsers, presenceSynced }
```

La lecture de `presenceState` et la déduplication par `user.id` restent le code
déjà présent dans le callback `sync`; aucun nouvel utilitaire n'est nécessaire.

Dans `useChat`, il faut aussi distinguer les participants non encore chargés
d'une liste réellement vide. L'action retourne `{ data } | { error }`; le calcul
ne devient disponible qu'après une réponse `{ data }` :

```ts
const [participantsLoaded, setParticipantsLoaded] = useState(false)

// Au changement de canal :
setParticipantsLoaded(false)

// Après getRoomParticipantsAction(channelId) :
if ('data' in response) {
  setParticipants(response.data)
  setParticipantsLoaded(true)
}
```

Si l'action retourne `{ error }`, ne pas interpréter ce résultat comme « aucun
membre déconnecté ».

## Flux complet jusqu'à la notification

Dans [`useChat`](../../apps/web/src/hooks/chat/useChat.ts), `sendMessage`
déclenche déjà `sendNotifications` après l'envoi temps réel et le lancement de
la persistance :

```ts
sendRealtimeMessage({ id: messageId, content: messageContent, createdAt })
if (persistMessage) {
  persistMessage({ id: messageId, createdAt, content: messageContent, channelId })
}
sendNotifications(messageContent)
```

Aujourd'hui, `sendNotifications` choisit les personnes mentionnées ou, en
l'absence de mention, les utilisateurs en ligne. Il contient aussi ce garde :

```ts
if (otherUsers.length === 0) return
```

Ce garde doit être déplacé : sinon, lorsqu'il n'y a aucun utilisateur en ligne,
la fonction sort avant de pouvoir notifier les absents.

Le changement proposé dans `sendNotifications` est de former une liste unique
avec les destinataires actuels et les absents, puis de laisser la boucle
d'envoi existante envoyer à chacun :

```ts
if (isMuted) return

const mentionTargets = extractMentionTargets(messageContent)
const toRecipient = (participant: ChatRoomParticipant) => ({
  id: participant.user.id,
  name: [participant.user.firstName, participant.user.lastName]
    .filter(Boolean)
    .join(' ') || participant.user.id,
  email: '',
  avatarUrl: participant.user.avatar_url ?? null,
})

const currentRecipients =
  mentionTargets.length > 0
    ? mentionTargets.map(toRecipient)
    : otherUsers
        .filter((connectedUser) => connectedUser.id)
        .map((connectedUser) => ({
          id: connectedUser.id!,
          name: connectedUser.name ?? connectedUser.email ?? 'Utilisateur',
          email: connectedUser.email ?? '',
          avatarUrl: connectedUser.avatar_url ?? null,
        }))

const connectedIds = new Set(
  Object.values(connectedUsers).flatMap(({ id }) => (id ? [id] : [])),
)

const offlineRecipients = participants
  .filter(({ user: participant }) =>
    participant.id !== user?.id && !connectedIds.has(participant.id),
  )
  .map(toRecipient)

const recipientsById = new Map(
  [...currentRecipients, ...offlineRecipients]
    .map((recipient) => [recipient.id, recipient]),
)
const recipients = [...recipientsById.values()]
if (recipients.length === 0) return

const mentionedIds = new Set(mentionTargets.map(({ user }) => user.id))
await Promise.allSettled(
  recipients.map(async (recipient) => {
    await sendPushNotificationToUserById(recipient.id, {
      message: mentionedIds.has(recipient.id)
        ? `${user?.name || 'Anonyme'} vous a mentionné: ${messageContent}`
        : messageContent,
    })
  }),
)
```

Ici, `currentRecipients` désigne la sélection actuelle (mentions ou utilisateurs
en ligne), `toRecipient` est le convertisseur déjà présent dans
`sendNotifications`, et `sendPushNotificationToUserById` est l'appel d'envoi
déjà utilisé par sa boucle. L'ajout effectif est `offlineRecipients` dans
`recipientsById` : chaque absent passe alors lui aussi à l'appel d'envoi.

Le calcul des absents ne doit être fait qu'après le chargement réussi des
participants et la synchronisation initiale de Presence, comme décrit plus haut.
Cette proposition n'ajoute ni modèle, ni endpoint, ni nouveau système d'envoi.

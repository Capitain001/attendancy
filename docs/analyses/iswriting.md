Voici le point 5, sous forme de modifications à appliquer. Le principe est que l'événement ne porte que `{ id, typing }`. Le nom affiché est retrouvé côté récepteur dans `connectedUsers` (la présence), donc il n'est jamais pris dans un payload non fiable. Si quelqu'un se déconnecte en pleine frappe, il disparaît aussi de l'indicateur.

## `constants.ts`

```ts
// Émission au plus toutes les 2,5 s pendant la frappe
export const TYPING_THROTTLE_MS = 2_500
// Sans nouvel événement depuis 4 s, l'utilisateur n'écrit plus.
// Doit rester supérieur au throttle (marge pour la latence), sinon l'indicateur clignote.
export const TYPING_EXPIRE_MS = 4_000
```

## `use-realtime-chat.ts`

En haut du fichier, à côté des autres événements :

```ts
import { TYPING_EXPIRE_MS, TYPING_THROTTLE_MS } from './constants'

type TypingEvent = { id: string; typing: boolean }
const EVENT_TYPING = 'typing'

const isTypingEvent = (payload: unknown): payload is TypingEvent => {
  const e = payload as Partial<TypingEvent> | null
  return typeof e?.id === 'string' && typeof e.typing === 'boolean'
}

const withoutId = (current: ReadonlySet<string>, id: string): ReadonlySet<string> => {
  if (!current.has(id)) return current
  const next = new Set(current)
  next.delete(id)
  return next
}
```

Dans le hook, avec les autres états :

```ts
// Ids des utilisateurs qui écrivent. Les noms sont résolus par l'appelant via la présence.
const [typingIds, setTypingIds] = useState<ReadonlySet<string>>(() => new Set())
// Un minuteur d'expiration par utilisateur : pas de polling, rendu seulement quand ça change
const typingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
// Ref et non state : le throttle ne doit pas provoquer de rendu
const lastTypingSentRef = useRef(0)
```

Dans l'effet d'abonnement, au début, après `let wasSubscribed = false` :

```ts
const timers = typingTimers.current

const clearTyping = (id: string) => {
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
  setTypingIds((current) => withoutId(current, id))
}
```

Dans la chaîne `.on(...)`, ajoute le handler. Dans le handler existant `EVENT_MESSAGE_TYPE`, ajoute en première ligne `if (received.user?.id) clearTyping(received.user.id)`, pour que l'indicateur disparaisse à l'arrivée du message.

```ts
.on('broadcast', { event: EVENT_TYPING }, ({ payload }) => {
  if (!isTypingEvent(payload) || payload.id === presenceKey) return
  const { id, typing } = payload

  if (!typing) return clearTyping(id)

  const previous = timers.get(id)
  if (previous) clearTimeout(previous)
  setTypingIds((current) => (current.has(id) ? current : new Set(current).add(id)))
  timers.set(id, setTimeout(() => clearTyping(id), TYPING_EXPIRE_MS))
})
```

Dans le nettoyage de l'effet, avec les autres resets :

```ts
timers.forEach(clearTimeout)
timers.clear()
lastTypingSentRef.current = 0
setTypingIds(new Set())
```

L'émission, à côté de `publishDelete` :

```ts
// typing: true est limité à un envoi toutes les TYPING_THROTTLE_MS ; typing: false (envoi du
// message, champ vidé) part tout de suite, mais seulement si un « écrit » avait été annoncé.
const notifyTyping = useCallback(
  (typing: boolean) => {
    if (!channel || !isConnected || !presenceKey) return

    if (typing) {
      const now = Date.now()
      if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return
      lastTypingSentRef.current = now
    } else {
      if (lastTypingSentRef.current === 0) return
      lastTypingSentRef.current = 0
    }

    // Éphémère : un échec n'a aucune conséquence, on ne le remonte pas
    void channel.send({
      type: 'broadcast',
      event: EVENT_TYPING,
      payload: { id: presenceKey, typing } satisfies TypingEvent,
    })
  },
  [channel, isConnected, presenceKey]
)
```

Au `return` du hook, ajoute `typingIds` et `notifyTyping`.

## `useChat.ts`

Récupère les deux valeurs du hook temps réel :

```ts
const { /* ... */, typingIds, notifyTyping } = useRealtimeChat({ channelId, user })
```

Enveloppe le setter, pour que l'UI continue d'appeler `setNewMessage` sans rien changer :

```ts
// Chaque modification du champ annonce (ou retire) « en train d'écrire »
const updateNewMessage = useCallback(
  (value: string) => {
    setNewMessage(value)
    notifyTyping(value.trim().length > 0)
  },
  [notifyTyping]
)
```

Dans `sendMessage`, retire l'indicateur tout de suite, car le broadcast du message n'arrive qu'après la persistance, parfois quelques secondes plus tard :

```ts
setNewMessage('')
notifyTyping(false)   // ← ajouter
setReplyToId(null)
// et ajouter notifyTyping aux dépendances du useCallback
```

Dérive les utilisateurs affichables à partir de la présence :

```ts
const typingUsers = useMemo(
  () =>
    [...typingIds]
      .map((id) => connectedUsers[id])
      .filter((u): u is PresenceUser => !!u),
  [typingIds, connectedUsers]
)
```

Au `return` : `setNewMessage: updateNewMessage` à la place de `setNewMessage`, et `typingUsers` dans l'état exposé.

## Pourquoi c'est construit ainsi

- **Throttle plus expiration** : avec 2,5 s et 4 s, une frappe continue garde l'indicateur allumé. Si l'utilisateur s'arrête sans vider le champ, il s'éteint 4 s après le dernier événement. Les trois arrêts rapides (message envoyé, champ vidé, message reçu de l'auteur) passent par `typing: false` ou l'arrivée du message.
- **Résolution par la présence** : le payload n'est pas fiable, donc un pair peut afficher « X écrit » en usurpant un `id`. L'effet reste purement visuel, et l'usurpation d'un id absent de la présence est ignorée.
- **Rendu limité** : l'état ne change que quand quelqu'un commence ou arrête d'écrire, pas à chaque frappe. Le throttle ne passe pas par un state.

## Limites assumées

- Au changement de canal, les autres clients verront l'indicateur jusqu'à l'expiration (4 s au plus) : je n'envoie pas de `typing: false` pendant le nettoyage, car il n'est pas garanti de partir avant `removeChannel`.
- Le texte « Alice écrit… », « Alice et Bob écrivent… » ou « Plusieurs personnes écrivent… » relève de l'UI : `typingUsers` te donne les noms et l'ordre d'arrivée suffit.


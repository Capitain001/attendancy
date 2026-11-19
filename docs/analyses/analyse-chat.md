Voici le patch du package chat, par fichier, avec uniquement les parties qui changent. Rien n'est testé. Le renommage `sentAt` → `createdAt` touche le hub, le package et les fixtures 

## 1. `limits.ts` (remplace `time.ts`, que tu supprimes avec `clampSentAt`)

```ts
// Règles partagées : le serveur (policy), l'inbox et la réception d'un pair appliquent les mêmes.
export const MAX_BACKDATE_MS = 7 * 86_400_000
export const MAX_CONTENT_LENGTH = 4000 // en caractères Unicode (le hub compte pareil)

// La date déclarée n'est retenue que si elle est plausible (ni futur, ni plus vieille que la limite).
// NaN échoue aux deux comparaisons : une date invalide est donc non fiable.
export function isTrustedCreatedAt(createdAt: Date, now: Date): boolean {
  const t = createdAt.getTime()
  return t <= now.getTime() && t >= now.getTime() - MAX_BACKDATE_MS
}
```

`index.ts` : `export * from './limits'` à la place de `./time`. Côté app, `policy.ts` perd ses deux définitions de R3 et les réexporte, et le schéma de création utilise la constante :

```ts
export { MAX_BACKDATE_MS, isTrustedCreatedAt } from '<nom-du-package>'
// validation.ts : v.maxLength(MAX_CONTENT_LENGTH, 'Message trop long')
```

## 2. `types.ts`, `outbox.ts`, `merge.ts` : renommage

```ts
// types.ts
Envelope.sentAt     → createdAt: string
OutboxItem.sentAt   → createdAt: string
export type SendResult = { data: unknown } | { error: string; retryable?: boolean }
```

```ts
// outbox.ts
export const byCreatedAt = (a: { createdAt: string; id: string }, b: { createdAt: string; id: string }) =>
  Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id)
// list() : .sort(byCreatedAt)
```

`merge.ts` : `createdAt: i.createdAt` et `createdAt: e.createdAt`. Ce fichier ne sert plus si tu utilises `buildChatMessages` ; tu peux le supprimer.

## 3. `inbox.ts` : date d'affichage fiable

```ts
import { isTrustedCreatedAt, MAX_BACKDATE_MS } from './limits'
import { byCreatedAt } from './outbox'

// maxAgeMs = MAX_BACKDATE_MS par défaut

// Date du pair si plausible AU MOMENT DE LA RÉCEPTION, sinon la date de réception.
// Évaluée contre receivedAt (et non « maintenant ») pour rester stable dans le temps.
// L'enveloppe stockée n'est jamais modifiée : la future signature porte sur l'original.
const displayed = ({ env, receivedAt }: InboxEntry): Envelope =>
  isTrustedCreatedAt(new Date(env.createdAt), new Date(receivedAt))
    ? env
    : { ...env, createdAt: receivedAt }

// list() : .map(([, v]) => displayed(v)).filter(...).sort(byCreatedAt)
```

## 4. `engine.ts`

**Dépendances et types :**

```ts
import { MAX_BACKDATE_MS, MAX_CONTENT_LENGTH } from './limits'

export type ChatSyncDeps = {
  // ...
  // Appelé une fois par message confirmé par le serveur, après retrait de l'outbox.
  // C'est ici que l'app diffuse en temps réel et notifie. Best-effort : une erreur est ignorée.
  onSent?: (item: OutboxItem, data: unknown) => void | Promise<void>
  // Canaux acceptés depuis les pairs. Sans lui, tout canal est accepté : à fournir.
  acceptsChannel?: (channelId: string) => boolean
}
// destructuration : ajouter onSent, acceptsChannel
```

**`toEnvelope` et `send`** : `createdAt: i.createdAt` et `createdAt: now().toISOString()`. Les envois LAN ne doivent plus retarder le chemin serveur (jusqu'à 5 s d'`ack_timeout`) :

```ts
void Promise.allSettled(
  transports.filter((t) => t.status() === 'connected').map((t) => pushTo(t, [item])),
)
void flush()
return item
```

**`pass()`** : refus transitoire, avec borne de durée, et `onSent`.

```ts
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
```

**Verrou entre onglets.** Chaque onglet a son propre moteur ; sans verrou, `onSent` se déclencherait deux fois (double push). Le second onglet attend, relit l'outbox partagée (déjà vidée) et n'envoie rien :

```ts
function withFlushLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
  return locks ? locks.request(`attendancy-chat-flush:${userId}`, task) : task()
}

// flush() : running = withFlushLock(run).finally(() => { running = null })
```

**`receive`** : le pair n'est pas fiable.

```ts
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUuid = (x: unknown): x is string => typeof x === 'string' && UUID.test(x)

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
    v: 1, id: env.id, channelId: env.channelId, authorId: env.authorId,
    authorName: typeof env.authorName === 'string' ? env.authorName.slice(0, 100) : null,
    content: env.content, parentId: env.parentId ?? null, createdAt: env.createdAt,
    sig: typeof env.sig === 'string' ? env.sig : null,
  }
  if (await inbox.put(clean)) onChange?.()
}
```

**`start()` / `stop()`** : idempotents, avec un envoi et un nettoyage dès le démarrage.

```ts
let started = false

function start() {
  if (started) return
  started = true
  for (const t of transports) { /* inchangé */ }
  timer = setInterval(() => void flush(), flushIntervalMs)
  void inbox.purge().catch(() => {})
  void flush() // envoie ce qui attendait avant la fermeture de l'app
}

function stop() {
  if (!started) return
  started = false
  /* inchangé */
}
```

## 5. `lan-transport.ts` : battement de cœur et rejets

Aujourd'hui, `ClientFrame::Ping` existe côté hub mais n'est jamais envoyé. Une connexion à moitié morte (téléphone en veille) ne déclenche pas `onclose`, et chaque envoi expire alors en `ack_timeout`. On ajoute un ping, et le traitement de la fermeture sort dans une fonction réutilisable :

```ts
// LanOptions : pingIntervalMs?: number  (défaut 20 000)

let pingTimer: ReturnType<typeof setInterval> | undefined
let lastSeen = 0
const stopPing = () => { clearInterval(pingTimer); pingTimer = undefined }

// Fermeture traitée UNE fois, qu'elle vienne de onclose ou de la détection de silence.
// Une socket remplacée ou arrêtée par stop() (ws !== sock) est ignorée.
function dropped(sock: WebSocketLike) {
  if (ws !== sock) return
  ws = null
  stopPing()
  failAll(new Error('closed'))
  if (stopped || fatal) return setState('closed')
  setState('connecting')
  const delay = Math.min(backoff.maxMs, backoff.minMs * 2 ** attempt++)
  retryTimer = setTimeout(() => void connect(), delay)
}

function startPing(sock: WebSocketLike) {
  stopPing()
  lastSeen = Date.now()
  pingTimer = setInterval(() => {
    if (ws !== sock) return stopPing()
    // Silence prolongé : on ne attend pas le close (qui peut tarder), on reconnecte
    if (Date.now() - lastSeen > pingMs * 2.5) {
      sock.onclose = null
      try { sock.close() } catch { /* déjà mort */ }
      return dropped(sock)
    }
    try { sock.send('{"t":"ping"}') } catch { /* le prochain tour tranchera */ }
  }, pingMs)
}
```

Dans `connect()` :

```ts
sock.onmessage = (ev) => {
  lastSeen = Date.now() // toute trame prouve que le hub est vivant
  /* ... parse ... */
  if (f.t === 'welcome') { attempt = 0; startPing(sock); /* ... */ }
  else if (f.t === 'reject') {
    if (f.id) settle(String(f.id), new Error(String(f.reason)))
    // Un rejet sans id ne ferme que s'il est fatal : un simple bad_frame ne doit pas
    // provoquer une boucle de reconnexion
    else if (FATAL.has(String(f.reason))) { fatal = true; sock.close() }
  }
}
sock.onclose = () => dropped(sock)
```

`start()` remet `attempt = 0`. `f.t === 'pong'` n'a pas de traitement : `lastSeen` suffit.

## 6. `pairing.ts`

```ts
return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)
  || (a === 169 && b === 254) // link-local : certains hotspots téléphone en attribuent
```

L'IPv6 reste refusé, et l'URL `ws://${host}` n'aurait de toute façon pas les crochets requis.

## 7. Hub (`protocol.rs`)

```rust
pub created_at: String,   // était sent_at ; rename_all = "camelCase" donne createdAt
```

`ingest` ne lit pas ce champ, donc rien d'autre. Fais un `grep -rn "sentAt\|sent_at"` sur le hub, ses tests, le package, l'e2e et l'adaptateur.

## 8. Ce que l'adaptateur devra fournir

Ces trois points sont des contrats du package, à respecter dans `sendToServer` et `onSent` :

```ts
// sendToServer : exception si le réseau est KO ; refus transitoire distingué par le code de la policy
if (!('data' in res) || !res.data) {
  const code = 'code' in res ? String(res.code) : ''
  return {
    error: ('error' in res && res.error) || 'Refusé',
    retryable: (MESSAGE.RETRYABLE_CODES as readonly string[]).includes(code),
  }
}

// onSent : diffusion Supabase avec la date retenue par le serveur, push seulement à la création
onSent: (item, data) => {
  const { created, createdAt } = data as { created: boolean; createdAt: string }
  void broadcast({ id: item.id, createdAt, /* ... */ }) // y compris pour un rejeu (invariant)
  if (created) void notify(item.channelId, item.id)     // un rejeu ne renotifie pas
}
```

## À vérifier

- **`sendToServer` sans délai maximum** : avec le verrou, un appel qui reste pendu bloque le flush des autres onglets. Entoure-le d'un `Promise.race` avec un délai (15 à 20 s) qui lève une exception, ce qui garde le message en `pending`.
- **Comptage des caractères** : le hub et `Array.from` comptent en points de code Unicode, alors que `v.maxLength` de valibot compte en unités UTF-16. Un message d'emojis passe donc le hub à 3 000 caractères mais est refusé par le serveur à 4 000 unités. Ajoute un cas emoji au test e2e (4 000 puis 4 001 caractères), et si l'écart compte pour toi, aligne la règle côté serveur.
- **Inbox sans plafond** : un hub malveillant peut la remplir. Un `maxEntries` (50 000 est large) avec purge des plus anciens règlerait ça, mais je le laisse pour plus tard.
- **Messages `unverified` dans l'affichage** : `buildChatMessages` ne reçoit pas encore l'inbox comme quatrième source. C'est l'objet de l'adaptateur, la prochaine étape.

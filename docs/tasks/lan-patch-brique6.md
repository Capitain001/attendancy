contexte  des lots :
HostLan se connecte encore à son propre relais. Il appelle onStarted(selfPairing) avec 127.0.0.1, et LanPanel branche cet appel sur sync.connectLan. C'est l'erreur déjà notée en annexe : avec --host-user, l'identité de l'hôte est réservée (author_reserved, fatal). Ça passe aujourd'hui parce que hub n'est jamais fourni (pas de natif). La brique 7 le remplace par le transport local de l'hôte. Je propose de retirer l'auto-connexion dès maintenant, puisque je modifie ce fichier.
lan-status.ts ignore author_reserved. FAILURES ne le contient pas, alors que le transport le traite comme fatal. L'utilisateur verrait le message générique « refusé la connexion ».
HubController.current() : la passation disait l'avoir retiré (« la reprise relève de l'application »), mais le code l'a gardé. Je le laisse tel quel : il sert au retour sur la page, et la brique 7 tranchera.
QrScanner / canScanQr sont exportés par packages/ui/.../index.ts et utilisés par JoinLan. Les retirer touche ces trois fichiers.
Plan, par lots (chacun livrable et testable à part)

Lot 1 : packages/chat, historique des confirmés

Dans l'inbox, confirm(ids) ne supprime plus l'entrée : il la remplace par une trace minimale (id et date de confirmation, sans le contenu). Cela vaut aussi pour les ids jamais reçus en local, sinon le relais peut les renvoyer.
put() ignore déjà tout id présent dans le store, donc il ignorera les traces. list() et has() les filtrent, knownIds() les inclut.
purge() supprime les traces trop vieilles, et un plafond d'environ 500 traces élimine les plus anciennes.
C'est la piste « à la source »  recommander. Les compteurs ne gonflent plus, même après rechargement, et useSyncCounts n'a pas besoin de changer.
Risque : un test unitaire existant peut vérifier qu'après confirm l'entrée a disparu du store.

Lot 2 : lan-transport.ts, exposer omitted

Lire omitted dans le welcome (0 s'il est absent) et le mettre à jour à chaque welcome. Pas de boucle de reconnexion, comme tu l'as décidé.
Ajouter un accesseur optionnel omitted?() sur ChatTransport (même modèle que failure?()), remis à 0 au start() et au stop().
Un test contre le faux relais, qui envoie un welcome avec omitted.

Lot 3 : ChatSyncProvider, une seule source de canaux actifs

Un seul activeChannels qui alimente le hello, inbox.knownIds et acceptsChannel. Il vaut la liste imposée par connectLan(p, { channels }) s'il y en a une, sinon la liste du provider.
La liste imposée est conservée dans le sessionStorage pour la reprise après rechargement, et retirée à disconnectLan.


Lot 4 : packages/ui

JoinLan : retirer le scanner intégré. Le BarcodeDetector ne sert plus. Un prop optionnel scanner (composant injecté) laisse la place à la brique 7. Sans lui, seule la saisie du lien reste.
Supprimer QrScanner.tsx, et retirer QrScanner et canScanQr de l'index.
HostLan : plus d'auto-connexion. onStarted ne reçoit plus que { host, port }, ou disparaît s'il ne sert à rien. Le QR reste, il est affiché seulement quand un hôte est actif.
lan-status : ajouter author_reserved et une vue « historique partiel » (formulation à valider : « N messages plus anciens manquent ici ; ils arriveront au retour d'Internet »).
Vocabulaire neutre dans les textes des fichiers toucher (« enseignant » devient « l'hôte »),

Lot 5 : LanPanel et MessageBubble

LanPanel : prop channels? transmise à connectLan(pairing, { channels }), avis « identité déclarée, non vérifiée » (décision 10), indicateur d'historique partiel, et conseil explicite si insecure_context (page https://). Pas de logique https au-delà de ce message, puisque c'est trop tôt pour décider.
MessageBubble : enrichir l'info-bulle de unverified pour dire que l'expéditeur est déclaré, pas vérifié.
local.tsx et route.tsx ne bougent pas. Le queryPersister reste une tâche séparée.

Voici les 5 lots de la brique 6 . Les blocs sont des remplacements ciblés, sauf `inbox.ts` et `JoinLan.tsx`, qui changent trop pour un patch.

## Lot 1 : inbox avec historique des confirmés

```ts
//packages\chat\src\inbox.ts
import type { KVStore } from './store'
import type { Envelope } from './types'
import { isTrustedCreatedAt, MAX_BACKDATE_MS } from './limits'
import { byCreatedAt } from './outbox'

export type InboxEntry = { env: Envelope; receivedAt: string }
// Trace d'un message confirmé par le serveur : l'id reste connu (annoncé au relais, ignoré par put)
// sans garder le contenu. Bornée par MAX_CONFIRMED.
export type ConfirmedMark = { confirmedAt: string }
export type InboxRecord = InboxEntry | ConfirmedMark

export const MAX_CONFIRMED = 500

export type Inbox = ReturnType<typeof createInbox>

const isEntry = (r: InboxRecord): r is InboxEntry => 'env' in r

// Date du pair si plausible AU MOMENT DE LA RÉCEPTION, sinon la date de réception.
// Évaluée contre receivedAt (et non « maintenant ») pour rester stable dans le temps.
// L'enveloppe stockée n'est jamais modifiée : la future signature porte sur l'original.
const displayed = ({ env, receivedAt }: InboxEntry): Envelope =>
  isTrustedCreatedAt(new Date(env.createdAt), new Date(receivedAt))
    ? env
    : { ...env, createdAt: receivedAt }

// Messages reçus d'un pair (hub LAN, BLE) : NON VÉRIFIÉS tant que la version
// du serveur n'est pas arrivée. confirm() les remplace par une trace (id seul) : le relais ne les
// renvoie plus (knownIds) et put() les ignore, même après rechargement.
export function createInbox({
  store,
  maxAgeMs = MAX_BACKDATE_MS,
  maxConfirmed = MAX_CONFIRMED,
  now = () => new Date(),
}: {
  store: KVStore<InboxRecord>
  maxAgeMs?: number
  maxConfirmed?: number
  now?: () => Date
}) {
  async function put(env: Envelope) {
    if (await store.get(env.id)) return false // déjà reçu, ou déjà confirmé
    await store.set(env.id, { env, receivedAt: now().toISOString() })
    return true
  }

  async function list(channelId?: string) {
    return (await store.entries())
      .flatMap(([, v]) => (isEntry(v) ? [displayed(v)] : []))
      .filter((e) => !channelId || e.channelId === channelId)
      .sort(byCreatedAt)
  }

  async function marks() {
    return (await store.entries())
      .flatMap(([id, v]) => (isEntry(v) ? [] : [{ id, at: Date.parse(v.confirmedAt) }]))
      .sort((a, b) => a.at - b.at)
  }

  async function trimConfirmed() {
    const all = await marks()
    for (const m of all.slice(0, Math.max(0, all.length - maxConfirmed))) await store.del(m.id)
  }

  async function confirm(ids: string[]) {
    const mark: ConfirmedMark = { confirmedAt: now().toISOString() }
    const recent = new Set(ids.slice(-maxConfirmed)) // au-delà du plafond, inutile de marquer
    for (const id of ids) {
      const cur = await store.get(id)
      if (cur && isEntry(cur)) await store.set(id, mark)
      else if (!cur && recent.has(id)) await store.set(id, mark)
    }
    await trimConfirmed()
  }

  async function purge() {
    const limit = now().getTime() - maxAgeMs
    for (const [id, v] of await store.entries()) {
      const at = isEntry(v) ? v.receivedAt : v.confirmedAt
      if (Date.parse(at) < limit) await store.del(id)
    }
    await trimConfirmed()
  }

  // Ids à annoncer au hub pour qu'il n'envoie pas ce qu'on a déjà : messages non confirmés
  // d'abord, puis les confirmés (en dernier : le transport garde la fin de la liste).
  async function knownIds(channelIds: string[], limit = 200) {
    const own = (await list()).filter((e) => channelIds.includes(e.channelId)).slice(-limit).map((e) => e.id)
    const confirmed = (await marks()).slice(-limit).map((m) => m.id)
    return [...own, ...confirmed]
  }

  return { put, list, confirm, purge, knownIds, has: async (id: string) => !!(await store.get(id)) }
}
```

Test à ajouter, dans un nouveau fichier :

```ts
//packages\chat\tests\inbox.confirmed.test.ts
import { describe, expect, it } from 'vitest'
import { createInbox, type InboxRecord } from '../src/inbox'
import { memoryStore } from '../src/store'
import type { Envelope } from '../src/types'

const env = (id: string): Envelope => ({
  v: 1,
  id,
  channelId: 'c1',
  authorId: 'a',
  content: 'x',
  createdAt: new Date().toISOString(),
})

describe('inbox : historique des confirmés', () => {
  it('un message confirmé n’est plus ré-inséré, mais reste annoncé au relais', async () => {
    const inbox = createInbox({ store: memoryStore<InboxRecord>() })
    await inbox.put(env('m1'))
    await inbox.confirm(['m1'])
    expect(await inbox.list()).toHaveLength(0)
    expect(await inbox.put(env('m1'))).toBe(false)
    expect(await inbox.knownIds(['c1'])).toContain('m1')
  })

  it('un id jamais reçu en local est aussi ignoré après confirmation', async () => {
    const inbox = createInbox({ store: memoryStore<InboxRecord>() })
    await inbox.confirm(['m9'])
    expect(await inbox.put(env('m9'))).toBe(false)
    expect(await inbox.list()).toHaveLength(0)
  })

  it('les traces sont plafonnées : les plus anciennes partent', async () => {
    let t = 0
    const inbox = createInbox({
      store: memoryStore<InboxRecord>(),
      maxConfirmed: 3,
      now: () => new Date(1_700_000_000_000 + t++ * 1000),
    })
    for (const id of ['a', 'b', 'c', 'd', 'e']) await inbox.confirm([id])
    expect(await inbox.has('a')).toBe(false)
    expect(await inbox.has('b')).toBe(false)
    expect(await inbox.has('e')).toBe(true)
  })
})
```

## Lot 2 : exposer `omitted` dans le transport

```ts
//packages\chat\src\engine.ts
// dans `interface ChatTransport`, après `failure?(): string | null` :
  // Messages plus anciens que le relais n'a pas pu joindre au dernier `welcome` (0 = historique complet)
  omitted?(): number
```

```ts
//packages\chat\src\lan-transport.ts
// 1) avec les autres variables d'état (après `let failure: string | null = null`) :
  let omitted = 0

// 2) dans onmessage, au début de la branche `if (f.t === 'welcome') {` :
        omitted = typeof f.omitted === 'number' && f.omitted > 0 ? f.omitted : 0

// 3) dans start() (après `failure = null`) et dans stop() (après `stopped = true`) :
      omitted = 0

// 4) dans l'objet retourné, après `failure: () => failure,` :
    omitted: () => omitted,
```

Le test a besoin d'un petit ajout dans le faux relais :

```ts
//packages\chat\tests\helpers\faux-relay.ts
// dans `type Behavior`, ajouter :
  welcome?: Record<string, unknown> // champs ajoutés au welcome (ex. { omitted: 7 })

// remplacer la ligne d'envoi du welcome :
        if (r === 'welcome') {
          ws.send(JSON.stringify({ t: 'welcome', backlog: [], peers: 1, ...behavior.welcome }))
        } else if (typeof r === 'object') ws.send(JSON.stringify({ t: 'reject', id: null, reason: r.reject }))
```

```ts
//packages\chat\tests\lan-transport.omitted.test.ts
import WebSocket from 'ws'
import { describe, expect, it } from 'vitest'
import { createLanTransport, type WebSocketCtor } from '../src/lan-transport'
import { fauxRelay, waitFor } from './helpers/faux-relay'

const make = (url: string) =>
  createLanTransport({
    url,
    token: 't',
    userId: 'u',
    channels: ['c1'],
    WebSocketImpl: WebSocket as unknown as WebSocketCtor,
  })

describe('lan-transport : omitted', () => {
  it('expose le nombre de messages omis du welcome, 0 sinon, et le remet à 0 à l’arrêt', async () => {
    const partial = await fauxRelay({ welcome: { omitted: 7 } })
    const t = make(partial.url)
    t.start()
    await waitFor(() => t.status() === 'connected')
    expect(t.omitted?.()).toBe(7)
    t.stop()
    expect(t.omitted?.()).toBe(0)
    await partial.close()

    const full = await fauxRelay()
    const t2 = make(full.url)
    t2.start()
    await waitFor(() => t2.status() === 'connected')
    expect(t2.omitted?.()).toBe(0)
    t2.stop()
    await full.close()
  })
})
```

## Lot 3 : `ChatSyncProvider.tsx`

```tsx
//apps\web\src\modules\chat\ChatSyncProvider.tsx
// A) imports : ajouter `type InboxRecord,` dans la liste importée de '@attendancy/chat'

// B) remplacer les deux déclarations LanState / LAN_IDLE, et la ligne connectLan du type Ctx :
export type LanState = {
  status: TransportStatus
  failure: string | null
  pairing: Pairing | null
  omitted: number // messages plus anciens non reçus au dernier welcome (0 = historique complet)
}
const LAN_IDLE: LanState = { status: 'idle', failure: null, pairing: null, omitted: 0 }
// dans Ctx :
  connectLan: (p: Pairing, opts?: { channels?: string[] }) => void

// C) après `const LAN_KEY = ...`, helpers de reprise (canaux imposés conservés avec le lien) :
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

// D) dans le composant, avec les autres refs :
  const resumeRef = useRef<(() => void) | null>(null)

// E) dans le useEffect principal :
// 1. type du store de l'inbox :
      store: idbStore<InboxRecord>(`attendancy-chat-inbox:${user.id}`),
// 2. AVANT `const engine = createChatSync({` :
    // Source unique des canaux actifs : hello, known et acceptsChannel. Les canaux imposés par
    // connectLan (profil métier) priment sur la liste du provider, utilisée en repli.
    let imposed: string[] | null = null
    const activeChannels = () => imposed ?? channelsRef.current
// 3. dans createChatSync :
      acceptsChannel: (id) => activeChannels().includes(id),
// 4. remplacer connectLan en entier :
    const connectLan = (p: Pairing, opts?: { channels?: string[] }) => {
      detachLan?.()
      imposed = opts?.channels?.length ? [...opts.channels] : null
      const transport = createLanTransport({
        url: p.url,
        token: p.token,
        userId: user.id,
        name: userRef.current.name,
        channels: activeChannels(),
        known: () => inbox.knownIds(activeChannels()),
      })
      // Abonné AVANT attach : le premier « connecting » n'est pas manqué
      const offStatus = transport.onStatus((status) => {
        const failure = transport.failure?.() ?? null
        if (failure) forget() // un code refusé ne doit pas être rejoué au rechargement
        setLan({ status, failure, pairing: p, omitted: transport.omitted?.() ?? 0 })
      })
      const detach = engine.attach(transport)
      detachLan = () => {
        offStatus()
        detach()
      }
      setLan({ status: transport.status(), failure: null, pairing: p, omitted: 0 })
      saveLan(p, imposed)
    }
// 5. dans disconnectLan, après `detachLan = undefined` :
      imposed = null
// 6. remplacer le bloc « Reprise après rechargement » (le try/catch complet) par :
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
// 7. dans la fonction de nettoyage de l'effet, ajouter :
      resumeRef.current = null

// F) après le useEffect principal, un second effet :
  // La liste des canaux arrive après le montage : reprise d'une séance locale en attente
  useEffect(() => {
    resumeRef.current?.()
  }, [channelIds.length])
```

`forget()` reste inchangé. Le comportement de `connectLan` sans options est identique à l'ancien.

## Lot 4 : `packages/ui`

```tsx
//packages\ui\src\components\chat\lan\JoinLan.tsx
'use client'

import { useCallback, useState, type ComponentType, type FormEvent } from 'react'
import type { Pairing } from '@attendancy/chat'
import { cn } from '../../../lib/utils'
import { button, typography } from '../../../styles/ui'
import { chat } from '../../../styles/ui/chat'
import { parsePairingInput } from './lan-status'

const INVALID = "Ce lien n'est pas celui d'une séance locale. Collez le lien affiché par l'hôte."

// Lecteur de code optionnel, fourni par l'app native (brique 7). Il appelle onResult avec le texte
// lu ; true = accepté. Le navigateur n'en fournit pas : la saisie du lien suffit.
export type PairingScannerProps = { onResult: (text: string) => boolean; onCancel: () => void }

export function JoinLan({
  onJoin,
  Scanner,
}: {
  onJoin: (pairing: Pairing) => void
  Scanner?: ComponentType<PairingScannerProps>
}) {
  const [scanning, setScanning] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  // true = lien accepté (le lecteur s'arrête), false = la lecture continue
  const accept = useCallback(
    (raw: string) => {
      const pairing = parsePairingInput(raw)
      if (!pairing) {
        setError(INVALID)
        return false
      }
      setError(null)
      setScanning(false)
      setText('')
      onJoin(pairing)
      return true
    },
    [onJoin],
  )

  function submit(e: FormEvent) {
    e.preventDefault()
    accept(text)
  }

  return (
    <div className="flex flex-col gap-4">
      {Scanner &&
        (scanning ? (
          <Scanner onResult={accept} onCancel={() => setScanning(false)} />
        ) : (
          <button type="button" className={cn(button.primary, 'self-start')} onClick={() => setScanning(true)}>
            Scanner le code
          </button>
        ))}

      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="lan-link" className={cn(typography.small, 'font-medium')}>
          {Scanner ? 'Ou collez le lien de la séance' : 'Lien de la séance'}
        </label>
        <div className="flex gap-2">
          <input
            id="lan-link"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={text}
            placeholder="attendancy://chat?…"
            aria-describedby={error ? 'lan-link-error' : undefined}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setText(e.target.value)
              if (error) setError(null)
            }}
            className={cn(typography.small, chat.field)}
          />
          <button type="submit" disabled={!text.trim()} className={Scanner ? button.secondary : button.primary}>
            Rejoindre
          </button>
        </div>
        {error && (
          <p id="lan-link-error" role="alert" className={cn(typography.small, 'text-destructive')}>
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
```

À supprimer : `packages\ui\src\components\chat\lan\QrScanner.tsx`.

```ts
//packages\ui\src\components\chat\index.ts
// remplacer les deux lignes JoinLan / QrScanner par :
export { JoinLan, type PairingScannerProps } from './lan/JoinLan'
// et dans le bloc lan-status, ajouter `describeOmitted,` avant `describeLan`
```

```ts
//packages\ui\src\components\chat\lan\lan-status.ts
// remplacer FAILURES :
const FAILURES: Record<string, string> = {
  bad_token: "Le code n'est plus valide. Demandez à l'hôte d'afficher le code actuel.",
  not_member: "Vous n'avez pas accès à cette séance.",
  bad_hello: "Le serveur local n'a pas compris la connexion. Mettez l'application à jour.",
  author_reserved: "Cet identifiant est réservé à l'hôte de la séance : rejoignez-la avec un autre compte.",
  insecure_context:
    "Ce navigateur bloque les connexions locales depuis une page sécurisée (https). Utilisez l'application installée.",
  unsupported: "Ce navigateur ne permet pas les connexions locales.",
}

// à ajouter sous describeLan :
// Historique reçu incomplet (welcome plafonné par le relais) : le serveur central comble au retour d'Internet.
export function describeOmitted(omitted: number): string | null {
  if (!(omitted > 0)) return null
  const s = omitted > 1 ? 's' : ''
  return `Historique incomplet sur cet appareil : ${omitted} message${s} plus ancien${s} non reçu${s}. Le serveur les restituera au retour d'Internet.`
}
```

```tsx
//packages\ui\src\components\chat\lan\HostLan.tsx
// 1) import : remplacer la ligne '@attendancy/chat' par
import { encodePairing } from '@attendancy/chat'

// 2) props : remplacer onStarted et son commentaire
  // Prévenu quand le relais est ouvert. L'hôte n'y rejoint PAS son propre relais comme client
  // (son identité y est réservée) : il passera par le transport local (brique 7).
  onStarted?: (info: { host: string; port: number }) => void

// 3) dans start(), remplacer les trois lignes après `setRunning(...)` (const self… / if (self)…) par
      onStarted?.({ host, port })

// 4) texte d'introduction : remplacer le paragraphe par
          Les autres appareils scannent un code pour échanger avec vous sans Internet, tant qu&apos;ils sont sur le même réseau.
```

## Lot 5 : `LanPanel` et `MessageBubble`

```tsx
//apps\web\src\modules\chat\lan\LanPanel.tsx
// 1) import : ajouter `describeOmitted,` à la liste importée de '@attendancy/ui'

// 2) props
interface LanPanelProps {
  hub?: HubController
  sessionId?: string
  // Canaux imposés par le profil métier (classe, salle…) : priment sur ceux du provider
  channels?: string[]
}
export function LanPanel({ hub, sessionId, channels }: LanPanelProps) {

// 3) après `const view = describeLan(...)` :
  const partial = lan.status === 'connected' ? describeOmitted(lan.omitted) : null

// 4) texte « slow » : remplacer « l'enseignant » par « l'hôte »

// 5) après le bloc `{view.detail && (...)}` :
        {partial && (
          <p role="status" className={cn(typography.small, 'text-foreground/70')}>
            {partial}
          </p>
        )}
        {lan.status === 'connected' && (
          <p className={cn(typography.xsmall, 'text-foreground/60')}>
            Les noms affichés sont déclarés par chaque appareil : ils ne sont pas vérifiés.
          </p>
        )}

// 6) JoinLan et HostLan :
          <JoinLan onJoin={(p) => sync.connectLan(p, { channels })} />
          <HostLan hub={hub} sessionId={sessionId} onStopped={sync.disconnectLan} />
```

```tsx
//packages\ui\src\components\chat\MessageBubble.tsx
// remplacer le <span title=...> du statut 'unverified' :
          <span title="Reçu d'un appareil du réseau local : l'expéditeur est déclaré, pas vérifié, et le serveur n'a pas encore confirmé ce message">
            Reçu en local, non confirmé
          </span>
```

## Notes

- **`useSyncCounts.ts`** : aucun changement, le lot 1 règle le gonflement.
- **Cold start hors ligne** : le provider n'ouvre plus de connexion sans canaux. Sans `channels` imposés, une reprise est mise en attente jusqu'à l'arrivée de la liste. Tant que `useChannels` n'est pas persisté, un redémarrage hors ligne sans canaux imposés ne reprend pas tout seul (tâche à part).
- **Limite héritée** : `channels` du `hello` est figé à la création du transport. Si la liste du provider arrive après la connexion, seuls une reconnexion ou des canaux imposés l'actualisent.
- **Cohérence à vérifier chez toi** : tout code qui crée un `createInbox` avec `KVStore<{env, receivedAt}>` doit passer au type `InboxRecord`, et les tests inbox existants qui regardent le contenu du store après `confirm`.


signale-moi les erreurs de compilation ou de test éventuelles. 


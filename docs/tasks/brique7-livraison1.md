# Brique 7 — Livraison 1 (Document unifié)

Document fusionné des parties A, B et C.

## Prérequis et points d'attention

- **Dépendances `packages/chat`** : `ws`, `@types/ws` et `vitest` doivent être en `devDependencies`.
- **Emplacement des tests Vitest** : `packages/chat/vitest.config.ts` inclut uniquement `tests/**/*.test.ts`. Les fichiers `*.test.ts` de `packages/chat` ci-dessous doivent donc être placés dans `packages/chat/tests/` (en adaptant les imports relatifs vers `../src/...` et `./testing/...` si les helpers de test sont aussi placés dans `packages/chat/tests/testing/`).
- **Correction Livraison 2 (déjà traitée)** : dans `crates/chat/relay/src/host.rs`, `HostError::code` utilise `Self::Rejected(reason) => *reason` (validé par `cargo test`).
- **Dépendance Livraison 3 (`@/native/host`)** : `apps/chat/src/routes/_app/local.tsx` importe `tauriHostBridge` et `tauriHub` depuis `@/native/host`, qui sera fourni en livraison 3.
- **Profil métier (`buildHostOptions`)** : en attente du branchement complet avec la liste des membres des canaux, `local.tsx` passe uniquement `{ hostUserId }`.

---

## 1. Adaptateur Tauri WebSocket

```ts
//packages\chat\src\tauri-websocket.ts
import type { WebSocketCtor } from './lan-transport'

// Expose le plugin Tauri (@tauri-apps/plugin-websocket) sous la forme du `WebSocketCtor` que
// `createLanTransport` attend. Le plugin est INJECTÉ : ce paquet ne dépend pas de Tauri,
// et les tests passent un faux.
//
// Différences à absorber (d'après le .d.ts du plugin) :
// - connect() est asynchrone et il n'y a ni événement open ni error : onopen = connect() résolu ;
// - une panne du flux arrive comme un message `Close` dans le listener ;
// - send() et disconnect() sont asynchrones, ceux d'un WebSocket sont synchrones.
//
// Garanties : `onclose` est appelé exactement UNE fois, quelle qu'en soit la cause (échec de
// connexion, Close du pair, close() local, envoi en échec), jamais de façon synchrone.
// `onopen` n'est jamais appelé après un close().

type Socket = InstanceType<WebSocketCtor>

/** Sous-ensemble du message du plugin : seuls `Text` et `Close` nous intéressent. */
export type TauriMessage = { type: string; data: unknown }

/** Sous-ensemble d'une connexion du plugin (la classe `WebSocket` du plugin y satisfait). */
export interface TauriConnection {
  addListener(cb: (message: TauriMessage) => void): () => void
  send(message: string): Promise<void>
  disconnect(): Promise<void>
}

/** Ce qu'on attend du plugin : sa classe `WebSocket` convient telle quelle (méthode statique connect). */
export interface TauriWebSocketPlugin {
  connect(url: string): Promise<TauriConnection>
}

export function createTauriWebSocketCtor(plugin: TauriWebSocketPlugin): WebSocketCtor {
  return class TauriWebSocket implements Socket {
    onopen: Socket['onopen'] = null
    onmessage: Socket['onmessage'] = null
    onclose: Socket['onclose'] = null
    // Jamais appelé : le plugin ne signale aucune erreur à part. La propriété doit exister
    // car lan-transport l'assigne.
    onerror: Socket['onerror'] = null

    private connection: TauriConnection | null = null
    private stopListening: (() => void) | null = null
    private finished = false
    // Envois chaînés : l'ordre d'émission est celui des appels, même si le plugin est asynchrone
    private sending: Promise<void> = Promise.resolve()

    constructor(url: string) {
      void this.connect(url)
    }

    private async connect(url: string) {
      let connection: TauriConnection
      try {
        connection = await plugin.connect(url)
      } catch {
        this.finish() // échec de connexion : un onclose, jamais d'onopen
        return
      }
      if (this.finished) {
        // close() demandé pendant la connexion : on referme celle qui vient de s'ouvrir
        void connection.disconnect().catch(() => {})
        return
      }
      this.connection = connection
      // Écouteur posé AVANT onopen, dans le même tour : le plugin ne rejoue pas les messages
      // arrivés alors que personne n'écoutait.
      this.stopListening = connection.addListener((m) => this.receive(m))
      this.onopen?.({})
    }

    private receive(m: TauriMessage) {
      if (this.finished) return
      if (m.type === 'Text' && typeof m.data === 'string') {
        this.onmessage?.({ data: m.data })
      } else if (m.type === 'Close') {
        this.finish()
      }
      // Binary, Ping, Pong : sans usage dans le protocole, ignorés
    }

    send(data: string) {
      if (this.finished) return // comme un vrai WebSocket : l'envoi après fermeture est ignoré
      const connection = this.connection
      if (!connection) throw new Error('not_open') // comme InvalidStateError pendant la connexion
      this.sending = this.sending
        .then(() => (this.finished ? undefined : connection.send(data)))
        .catch(() => this.finish()) // un envoi en échec = connexion perdue
    }

    close() {
      this.finish()
    }

    // Point unique de fermeture : idempotent, d'où le onclose unique
    private finish() {
      if (this.finished) return
      this.finished = true
      this.stopListening?.()
      this.stopListening = null
      const connection = this.connection
      this.connection = null
      // Libère la connexion côté Rust, même quand c'est le pair qui a fermé
      if (connection) void connection.disconnect().catch(() => {})
      // Jamais synchrone : comme un vrai WebSocket, et comme l'attend lan-transport
      queueMicrotask(() => this.onclose?.({}))
    }
  }
}
```

---

## 2. Suite de contrat et outils de test WebSocket

> Note : pour être exécutés par Vitest (`include: ['tests/**/*.test.ts']` dans `packages/chat/vitest.config.ts`), placer les fichiers `*.test.ts` dans `packages/chat/tests/` (et ajuster les imports relatifs).

```ts
//packages\chat\src\testing\websocket-contract.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { WebSocketCtor } from '../lan-transport'

// Contrat d'un WebSocketCtor tel que lan-transport l'utilise. Elle tourne contre `ws`
// (référence), puis contre l'adaptateur Tauri. Durées en millisecondes.

/** Serveur de test, piloté par la suite. */
export type ContractServer = {
  /** URL joignable */
  url: string
  /** URL où personne n'écoute (échec de connexion) */
  deadUrl: string
  /** Textes reçus des clients, dans l'ordre */
  received: string[]
  sendText(text: string): void
  /** Fermeture propre (trame Close) de toutes les connexions */
  closeClients(): void
  /** Coupure brutale : socket détruite, sans trame Close */
  dropClients(): void
}

export type ContractTarget = {
  Ctor: WebSocketCtor
  server: ContractServer
  stop(): Promise<void>
}

const wait = (delay: number) => new Promise<void>((resolve) => setTimeout(resolve, delay))

async function until(cond: () => boolean, label: string, timeout = 3000) {
  const end = Date.now() + timeout
  while (!cond()) {
    if (Date.now() > end) throw new Error(`délai dépassé : ${label}`)
    await wait(10)
  }
}

// Laisse le temps à un appel en trop de se produire avant de conclure « exactement une fois »
const SETTLE = 150

function track(Ctor: WebSocketCtor, url: string) {
  const log = { opens: 0, closes: 0, messages: [] as unknown[] }
  const sock = new Ctor(url)
  sock.onopen = () => void log.opens++
  sock.onmessage = (ev) => void log.messages.push(ev.data)
  sock.onclose = () => void log.closes++
  sock.onerror = () => {} // comme lan-transport
  return { sock, log }
}

export function webSocketCtorContract(name: string, factory: () => Promise<ContractTarget>) {
  describe(`contrat WebSocketCtor : ${name}`, () => {
    let t: ContractTarget
    beforeEach(async () => {
      t = await factory()
    })
    afterEach(async () => {
      await t.stop()
    })

    it('onopen est appelé une fois', async () => {
      const { log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      await wait(SETTLE)
      expect(log.opens).toBe(1)
      expect(log.closes).toBe(0)
    })

    it('onmessage reçoit data en chaîne', async () => {
      const { log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      t.server.sendText('bonjour')
      await until(() => log.messages.length === 1, 'message')
      expect(log.messages).toEqual(['bonjour'])
      expect(typeof log.messages[0]).toBe('string')
    })

    it('les envois arrivent dans l\'ordre', async () => {
      const { sock, log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      const sent = Array.from({ length: 20 }, (_, i) => `m${i}`)
      sent.forEach((s) => sock.send(s))
      await until(() => t.server.received.length === sent.length, 'réception serveur')
      expect(t.server.received).toEqual(sent)
    })

    it('échec de connexion : onclose une fois, jamais onopen', async () => {
      const { log } = track(t.Ctor, t.server.deadUrl)
      await until(() => log.closes === 1, 'onclose')
      await wait(SETTLE)
      expect(log.closes).toBe(1)
      expect(log.opens).toBe(0)
    })

    it('close() local : onclose une fois, close() idempotent', async () => {
      const { sock, log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      sock.close()
      await until(() => log.closes === 1, 'onclose')
      expect(() => sock.close()).not.toThrow()
      await wait(SETTLE)
      expect(log.closes).toBe(1)
    })

    it('close() pendant la connexion : aucun onopen, un seul onclose', async () => {
      const { sock, log } = track(t.Ctor, t.server.url)
      sock.close()
      await until(() => log.closes === 1, 'onclose')
      await wait(SETTLE)
      expect(log.closes).toBe(1)
      expect(log.opens).toBe(0)
    })

    it('fermeture propre côté serveur : onclose une fois', async () => {
      const { log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      t.server.closeClients()
      await until(() => log.closes === 1, 'onclose')
      await wait(SETTLE)
      expect(log.closes).toBe(1)
    })

    it('coupure brutale sans trame Close : onclose une fois', async () => {
      const { log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      t.server.dropClients()
      await until(() => log.closes === 1, 'onclose')
      await wait(SETTLE)
      expect(log.closes).toBe(1)
    })

    it('send après fermeture ne lève pas et n\'envoie rien', async () => {
      const { sock, log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      sock.close()
      await until(() => log.closes === 1, 'onclose')
      expect(() => sock.send('tard')).not.toThrow()
      await wait(SETTLE)
      expect(t.server.received).not.toContain('tard')
    })
  })
}
```

```ts
//packages\chat\src\testing\ws-server.ts
import { createServer, type AddressInfo } from 'node:net'
import { WebSocket as WsClient, WebSocketServer } from 'ws'
import type { WebSocketCtor } from '../lan-transport'
import type { ContractServer, ContractTarget } from './websocket-contract'

// Un port qui vient d'être libéré : personne n'y écoute (échec de connexion)
async function freePort(): Promise<number> {
  const probe = createServer()
  await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve))
  const { port } = probe.address() as AddressInfo
  await new Promise<void>((resolve) => probe.close(() => resolve()))
  return port
}

export async function startServer(): Promise<{ server: ContractServer; stop(): Promise<void> }> {
  const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 })
  await new Promise<void>((resolve) => wss.once('listening', () => resolve()))
  const { port } = wss.address() as AddressInfo
  const deadPort = await freePort()

  const received: string[] = []
  wss.on('connection', (client) => {
    client.on('message', (data) => received.push(data.toString()))
    client.on('error', () => {})
  })

  const server: ContractServer = {
    url: `ws://127.0.0.1:${port}`,
    deadUrl: `ws://127.0.0.1:${deadPort}`,
    received,
    sendText: (text) => wss.clients.forEach((c) => c.send(text)),
    closeClients: () => wss.clients.forEach((c) => c.close(1000)),
    dropClients: () => wss.clients.forEach((c) => c.terminate()),
  }
  return {
    server,
    stop: async () => {
      wss.clients.forEach((c) => c.terminate())
      await new Promise<void>((resolve) => wss.close(() => resolve()))
    },
  }
}

/** Référence : le client `ws` lui-même. */
export async function wsTarget(): Promise<ContractTarget> {
  const { server, stop } = await startServer()
  return { Ctor: WsClient as unknown as WebSocketCtor, server, stop }
}
```

```ts
//packages\chat\src\testing\fake-tauri-plugin.ts
import { WebSocket as WsClient } from 'ws'
import type { TauriConnection, TauriMessage, TauriWebSocketPlugin } from '../tauri-websocket'

// Faux plugin au-dessus de `ws`, qui imite le vrai : connect() asynchrone, pas d'événement open,
// panne du flux ET fermeture signalées toutes deux par un message `Close` (donc parfois
// deux fois : l'adaptateur doit n'en tirer qu'un onclose).
export function createFakeTauriPlugin(): TauriWebSocketPlugin {
  return {
    connect: (url) =>
      new Promise<TauriConnection>((resolve, reject) => {
        const ws = new WsClient(url)
        const listeners = new Set<(m: TauriMessage) => void>()
        const emit = (m: TauriMessage) => listeners.forEach((cb) => cb(m))
        let opened = false

        const connection: TauriConnection = {
          addListener(cb) {
            listeners.add(cb)
            return () => void listeners.delete(cb)
          },
          send: (message) =>
            new Promise<void>((res, rej) => ws.send(message, (e) => (e ? rej(e) : res()))),
          disconnect: () =>
            new Promise<void>((res) => {
              if (ws.readyState === WsClient.CLOSED) return res()
              ws.once('close', () => res())
              ws.close(1000)
            }),
        }

        ws.on('open', () => {
          opened = true
          resolve(connection)
        })
        ws.on('message', (data, isBinary) =>
          emit(
            isBinary
              ? { type: 'Binary', data: [...(data as Buffer)] }
              : { type: 'Text', data: data.toString() },
          ),
        )
        ws.on('error', (e) => (opened ? emit({ type: 'Close', data: null }) : reject(String(e))))
        ws.on('close', (code, reason) =>
          opened ? emit({ type: 'Close', data: { code, reason: reason.toString() } }) : reject('closed'),
        )
      }),
  }
}
```

```ts
//packages\chat\tests\websocket-contract.ws.test.ts (adapter l'import vers ../src/testing/...)
import { webSocketCtorContract } from '../src/testing/websocket-contract'
import { wsTarget } from '../src/testing/ws-server'

// La référence d'abord : si `ws` échoue ici, c'est la suite qui est fausse, pas l'adaptateur
webSocketCtorContract('ws (référence)', wsTarget)
```

```ts
//packages\chat\tests\tauri-websocket.test.ts (adapter les imports vers ../src/...)
import { describe, expect, it } from 'vitest'
import { createTauriWebSocketCtor, type TauriConnection, type TauriMessage } from '../src/tauri-websocket'
import { createFakeTauriPlugin } from '../src/testing/fake-tauri-plugin'
import { webSocketCtorContract } from '../src/testing/websocket-contract'
import { startServer } from '../src/testing/ws-server'

// Même suite que `ws`, contre l'adaptateur posé sur un faux plugin réaliste
webSocketCtorContract('adaptateur Tauri (faux plugin sur ws)', async () => {
  const { server, stop } = await startServer()
  return { Ctor: createTauriWebSocketCtor(createFakeTauriPlugin()), server, stop }
})

// Plugin piloté à la main : pour les cas qu'un vrai serveur ne sait pas provoquer
function manualPlugin() {
  const h = {
    listeners: new Set<(m: TauriMessage) => void>(),
    sent: [] as string[],
    disconnects: 0,
    connectGate: Promise.resolve(),
    connectFails: false,
    sendImpl: async (_message: string) => {},
    emit: (m: TauriMessage) => h.listeners.forEach((cb) => cb(m)),
  }
  const connection: TauriConnection = {
    addListener: (cb) => {
      h.listeners.add(cb)
      return () => void h.listeners.delete(cb)
    },
    send: async (message) => {
      await h.sendImpl(message)
      h.sent.push(message)
    },
    disconnect: async () => void h.disconnects++,
  }
  const plugin = {
    connect: async () => {
      await h.connectGate
      if (h.connectFails) throw 'refusé'
      return connection
    },
  }
  return { h, Ctor: createTauriWebSocketCtor(plugin) }
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 20))

describe('adaptateur Tauri : cas propres au plugin', () => {
  it('ne transmet que les messages Text', async () => {
    const { h, Ctor } = manualPlugin()
    const got: unknown[] = []
    const sock = new Ctor('ws://x')
    sock.onmessage = (ev) => void got.push(ev.data)
    await tick()
    h.emit({ type: 'Binary', data: [1] })
    h.emit({ type: 'Ping', data: [] })
    h.emit({ type: 'Pong', data: [] })
    h.emit({ type: 'Text', data: 'ok' })
    expect(got).toEqual(['ok'])
  })

  it('l\'écouteur est posé avant onopen', async () => {
    const { h, Ctor } = manualPlugin()
    const got: unknown[] = []
    const sock = new Ctor('ws://x')
    sock.onmessage = (ev) => void got.push(ev.data)
    // Un message émis pendant onopen même doit être reçu
    sock.onopen = () => h.emit({ type: 'Text', data: 'dans-onopen' })
    await tick()
    expect(got).toEqual(['dans-onopen'])
  })

  it('deux Close du plugin : un seul onclose, une seule libération', async () => {
    const { h, Ctor } = manualPlugin()
    let closes = 0
    const sock = new Ctor('ws://x')
    sock.onclose = () => void closes++
    await tick()
    h.emit({ type: 'Close', data: null })
    h.emit({ type: 'Close', data: { code: 1006, reason: '' } })
    await tick()
    expect(closes).toBe(1)
    expect(h.disconnects).toBe(1)
  })

  it('un envoi en échec ferme la socket (onclose une fois)', async () => {
    const { h, Ctor } = manualPlugin()
    let closes = 0
    const sock = new Ctor('ws://x')
    sock.onclose = () => void closes++
    await tick()
    h.sendImpl = async () => {
      throw new Error('écriture impossible')
    }
    sock.send('a')
    sock.send('b')
    await tick()
    expect(closes).toBe(1)
    expect(h.sent).toEqual([])
  })

  it('les envois partent dans l\'ordre même si le plugin est lent', async () => {
    const { h, Ctor } = manualPlugin()
    const sock = new Ctor('ws://x')
    await tick()
    let n = 0
    // Les premiers appels sont les plus lents : sans chaînage, l'ordre serait inversé
    h.sendImpl = () => new Promise((resolve) => setTimeout(resolve, 15 - 3 * n++))
    ;['a', 'b', 'c', 'd'].forEach((s) => sock.send(s))
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(h.sent).toEqual(['a', 'b', 'c', 'd'])
  })

  it('close() pendant la connexion : la connexion tardive est refermée, sans onopen', async () => {
    const { h, Ctor } = manualPlugin()
    let release!: () => void
    h.connectGate = new Promise<void>((resolve) => (release = resolve))
    let opens = 0
    let closes = 0
    const sock = new Ctor('ws://x')
    sock.onopen = () => void opens++
    sock.onclose = () => void closes++
    sock.close()
    release()
    await tick()
    expect(opens).toBe(0)
    expect(closes).toBe(1)
    expect(h.disconnects).toBe(1)
  })

  it('connexion refusée : onclose une fois, jamais onopen', async () => {
    const { h, Ctor } = manualPlugin()
    h.connectFails = true
    let opens = 0
    let closes = 0
    const sock = new Ctor('ws://x')
    sock.onopen = () => void opens++
    sock.onclose = () => void closes++
    await tick()
    expect(opens).toBe(0)
    expect(closes).toBe(1)
  })

  it('send avant l\'ouverture lève, comme un vrai WebSocket', () => {
    const { Ctor } = manualPlugin()
    const sock = new Ctor('ws://x')
    expect(() => sock.send('trop tôt')).toThrow()
  })
})
```

---

## 3. Transport local de l'hôte

```ts
//packages\chat\src\local-host-transport.ts
import type { ChatTransport, TransportStatus } from './engine'
import type { Envelope } from './types'

// Transport de l'utilisateur qui HÉBERGE le relais (même processus) : ses messages passent par
// le pont natif (post_as_host) au lieu d'une socket, et il reçoit ce que disent les autres.
// Le pont est une petite interface : Tauri l'implémente en livraison 3, un faux dans les tests.

export interface HostBridge {
  /** Publie un message de l'hôte. true = nouveau, false = déjà connu. Rejette avec la raison du refus. */
  post(env: Envelope): Promise<boolean>
  /** Messages acceptés depuis le réseau (jamais ceux de l'hôte). */
  onMessage(cb: (env: Envelope) => void): () => void
  /** Tout ce que le relais garde. */
  snapshot(): Promise<Envelope[]>
  /** Le récepteur a pris du retard (Lagged) : des messages ont été perdus, relire l'instantané. */
  onResync(cb: () => void): () => void
}

export type LocalHostOptions = {
  /** Identité de l'hôte : ses propres messages ne lui sont pas renvoyés. */
  hostUserId: string
}

// Raison d'un rejet du pont : Error('not_member'), { code: 'not_member' } (erreur Tauri
// sérialisée) ou simple chaîne. Chaîne vide si inconnue : le moteur s'arrête alors par prudence.
function reasonOf(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'code' in e) return String((e as { code: unknown }).code)
  return ''
}

export function createLocalHostTransport(bridge: HostBridge, opts: LocalHostOptions): ChatTransport {
  let state: TransportStatus = 'idle'
  let stopped = true
  let failure: string | null = null
  // Chaque start() ouvre une génération : un instantané en vol après stop() ne livre rien
  let generation = 0
  let syncing = false
  let resyncQueued = false
  const offs: (() => void)[] = []

  const recvCbs = new Set<(e: Envelope) => void>()
  const statusCbs = new Set<(s: TransportStatus) => void>()

  const setState = (s: TransportStatus) => {
    if (state === s) return
    state = s
    statusCbs.forEach((cb) => cb(s))
  }

  // Les messages de l'hôte sont les siens : inutile de les lui renvoyer
  const deliver = (env: Envelope) => {
    if (env.authorId === opts.hostUserId) return
    recvCbs.forEach((cb) => cb(env))
  }

  // Relit tout ce que garde le relais ; les doublons sont écartés par l'inbox
  async function catchUp(gen: number) {
    const all = await bridge.snapshot()
    if (gen !== generation) return
    all.forEach(deliver)
  }

  // Plusieurs `Lagged` d'affilée : une seule relecture en cours, une de plus au plus
  async function resync(gen: number) {
    if (syncing) {
      resyncQueued = true
      return
    }
    syncing = true
    try {
      do {
        resyncQueued = false
        await catchUp(gen).catch(() => {}) // le prochain Lagged réessaiera
      } while (resyncQueued && gen === generation)
    } finally {
      syncing = false
    }
  }

  return {
    name: 'local',
    status: () => state,
    failure: () => failure,
    omitted: () => 0, // l'hôte lit l'instantané complet : jamais d'historique omis
    start() {
      if (!stopped) return
      stopped = false
      failure = null
      generation++
      const gen = generation
      setState('connecting')

      // Abonnement AVANT la lecture de l'instantané : un message arrivé entre les deux
      // serait sinon perdu.
      offs.push(bridge.onMessage(deliver), bridge.onResync(() => void resync(gen)))

      // L'instantané est livré AVANT « connected » (comme le backlog d'un welcome) : le moteur
      // renvoie l'outbox à ce statut, après avoir reçu l'historique.
      void catchUp(gen)
        .then(() => {
          if (gen === generation) setState('connected')
        })
        .catch((e) => {
          if (gen !== generation) return
          failure = reasonOf(e) || 'snapshot_failed'
          stopped = true
          offs.splice(0).forEach((off) => off())
          setState('closed')
        })
    },
    stop() {
      stopped = true
      generation++
      syncing = false
      resyncQueued = false
      offs.splice(0).forEach((off) => off())
      setState('closed')
    },
    async send(env) {
      if (state !== 'connected') throw new Error('not_connected')
      try {
        await bridge.post(env) // true ou false (doublon) : dans les deux cas le message est connu
      } catch (e) {
        const reason = reasonOf(e)
        // Relais arrêté : c'est la connexion qui est perdue, pas ce message
        if (reason === 'NotRunning') {
          setState('closed')
          throw new Error('closed')
        }
        // Autre refus (not_member, bad_content, channel_limit...) : ne concerne que CE message,
        // le moteur passe au suivant
        throw new Error(reason)
      }
    },
    onReceive(cb) {
      recvCbs.add(cb)
      return () => void recvCbs.delete(cb)
    },
    onStatus(cb) {
      statusCbs.add(cb)
      return () => void statusCbs.delete(cb)
    },
  }
}
```

```ts
//packages\chat\tests\local-host-transport.test.ts (adapter l'import vers ../src/...)
import { describe, expect, it } from 'vitest'
import { createLocalHostTransport, type HostBridge } from '../src/local-host-transport'
import type { Envelope } from '../src/types'

const env = (id: string, authorId = 'a'): Envelope => ({
  v: 1,
  id,
  channelId: 'c1',
  authorId,
  authorName: null,
  content: 'salut',
  parentId: null,
  createdAt: '2026-11-27T10:00:00.000Z',
})

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 20))

function makeBridge() {
  const msgs = new Set<(e: Envelope) => void>()
  const resyncs = new Set<() => void>()
  const h = {
    snapshot: [] as Envelope[],
    gate: Promise.resolve(),
    snapshotCalls: 0,
    snapshotFails: false,
    posted: [] as Envelope[],
    post: async (_e: Envelope): Promise<boolean> => true,
    subscribers: () => msgs.size + resyncs.size,
    emit: (e: Envelope) => msgs.forEach((cb) => cb(e)),
    lag: () => resyncs.forEach((cb) => cb()),
  }
  const bridge: HostBridge = {
    post: (e) => {
      h.posted.push(e)
      return h.post(e)
    },
    onMessage: (cb) => {
      msgs.add(cb)
      return () => void msgs.delete(cb)
    },
    snapshot: async () => {
      h.snapshotCalls++
      await h.gate
      if (h.snapshotFails) throw { code: 'NotRunning' }
      return h.snapshot
    },
    onResync: (cb) => {
      resyncs.add(cb)
      return () => void resyncs.delete(cb)
    },
  }
  return { h, bridge }
}

function setup() {
  const { h, bridge } = makeBridge()
  const t = createLocalHostTransport(bridge, { hostUserId: 'prof' })
  const events: string[] = []
  t.onStatus((s) => events.push(s))
  t.onReceive((e) => events.push(e.id))
  return { h, t, events }
}

describe('transport local de l\'hôte', () => {
  it('livre l\'instantané avant de passer à connected', async () => {
    const { h, t, events } = setup()
    h.snapshot = [env('m1'), env('m2')]
    t.start()
    await flush()
    expect(events).toEqual(['connecting', 'm1', 'm2', 'connected'])
  })

  it('s\'abonne avant de lire l\'instantané : rien ne se perd entre les deux', async () => {
    const { h, t, events } = setup()
    let release!: () => void
    h.gate = new Promise<void>((resolve) => (release = resolve))
    h.snapshot = [env('m1')]
    t.start()
    await flush()
    h.emit(env('m2')) // arrive pendant que l'instantané est encore en cours
    release()
    await flush()
    expect(events).toContain('m2')
    expect(events).toContain('m1')
    expect(t.status()).toBe('connected')
  })

  it('ignore les messages de l\'hôte', async () => {
    const { h, t, events } = setup()
    h.snapshot = [env('m1', 'prof'), env('m2', 'a')]
    t.start()
    await flush()
    h.emit(env('m3', 'prof'))
    expect(events.filter((e) => e.startsWith('m'))).toEqual(['m2'])
  })

  it('Lagged : relit l\'instantané', async () => {
    const { h, t, events } = setup()
    t.start()
    await flush()
    h.snapshot = [env('m5')]
    h.lag()
    await flush()
    expect(events).toContain('m5')
  })

  it('plusieurs Lagged d\'affilée : au plus une relecture en attente', async () => {
    const { h, t } = setup()
    t.start()
    await flush() // 1 lecture au démarrage
    let release!: () => void
    h.gate = new Promise<void>((resolve) => (release = resolve))
    h.lag()
    h.lag()
    h.lag()
    release()
    await flush()
    expect(h.snapshotCalls).toBe(3) // démarrage + relecture en cours + une relecture de rattrapage
  })

  it('send : succès et doublon se résolvent', async () => {
    const { h, t } = setup()
    t.start()
    await flush()
    h.post = async () => true
    await expect(t.send(env('m1', 'prof'))).resolves.toBeUndefined()
    h.post = async () => false
    await expect(t.send(env('m1', 'prof'))).resolves.toBeUndefined()
  })

  it('send : le refus d\'un message nomme la raison, sans fermer', async () => {
    const { h, t } = setup()
    t.start()
    await flush()
    h.post = async () => {
      throw { code: 'not_member' } // forme d'une erreur Tauri sérialisée
    }
    await expect(t.send(env('m1', 'prof'))).rejects.toThrow('not_member')
    h.post = async () => {
      throw new Error('bad_content')
    }
    await expect(t.send(env('m2', 'prof'))).rejects.toThrow('bad_content')
    expect(t.status()).toBe('connected')
  })

  it('send hors connexion : not_connected', async () => {
    const { t } = setup()
    await expect(t.send(env('m1', 'prof'))).rejects.toThrow('not_connected')
  })

  it('relais arrêté (NotRunning) : closed, et le transport passe à closed', async () => {
    const { h, t } = setup()
    t.start()
    await flush()
    h.post = async () => {
      throw { code: 'NotRunning' }
    }
    await expect(t.send(env('m1', 'prof'))).rejects.toThrow('closed')
    expect(t.status()).toBe('closed')
  })

  it('instantané en échec : closed avec la cause, abonnements retirés', async () => {
    const { h, t } = setup()
    h.snapshotFails = true
    t.start()
    await flush()
    expect(t.status()).toBe('closed')
    expect(t.failure?.()).toBe('NotRunning')
    expect(h.subscribers()).toBe(0)
  })

  it('stop pendant l\'instantané : rien n\'est livré, plus d\'abonnement', async () => {
    const { h, t, events } = setup()
    let release!: () => void
    h.gate = new Promise<void>((resolve) => (release = resolve))
    h.snapshot = [env('m1')]
    t.start()
    await flush()
    t.stop()
    release()
    await flush()
    expect(events).toEqual(['connecting', 'closed'])
    expect(h.subscribers()).toBe(0)
  })

  it('start, stop puis start : repart proprement', async () => {
    const { h, t, events } = setup()
    h.snapshot = [env('m1')]
    t.start()
    await flush()
    t.stop()
    t.start()
    await flush()
    expect(t.status()).toBe('connected')
    expect(events.filter((e) => e === 'm1')).toHaveLength(2)
    expect(h.subscribers()).toBe(2)
  })
})
```

---

## 4. Profils métier

```ts
//apps\web\src\modules\chat\host-profile.ts
// Profils d'hébergement : transforment « qui est dans quel canal » en réglages du relais.
// Fonction pure, sans E/S : testable sans relais.

export type HostProfileKind = 'class' | 'room' | 'dm'

export type HostChannel = { id: string; memberIds: string[] }

export type HostProfile = {
  kind: HostProfileKind
  hostUserId: string
  channels: HostChannel[]
}

/** Réglages transmis au service d'hébergement (le jeton et l'adresse se décident ailleurs). */
export type HostProfileOptions = {
  hostUserId: string
  members: Record<string, string[]>
  maxConnections: number
  maxPendingHello: number
}

// Un client qui se reconnecte reste compté par le relais jusqu'à `idle_timeout` (60 s) : le
// plafond de connexions = effectif attendu + une marge pour ces connexions fantômes.
// Marge = max(marginMin, ceil(effectif × marginRatio)). Valeurs par défaut, à ajuster.
const PROFILE_LIMITS: Record<HostProfileKind, { marginRatio: number; marginMin: number }> = {
  class: { marginRatio: 0.2, marginMin: 2 },
  room: { marginRatio: 0.2, marginMin: 2 },
  dm: { marginRatio: 0, marginMin: 2 }, // 1 pair + 2 = 3
}

// Plafonds du relais (HubConfig : max_connections, max_channels)
const MAX_CONNECTIONS_CAP = 256
const MAX_CHANNELS = 64
// Connexions sans `hello` simultanées : toute une classe scanne le QR en même temps. Le défaut
// du relais (32) refuserait des élèves légitimes ; ils réessaieraient, mais autant l'éviter.
const MAX_PENDING_HELLO_CAP = 64

export function buildHostOptions(profile: HostProfile): HostProfileOptions {
  const { kind, hostUserId, channels } = profile
  if (!hostUserId) throw new RangeError('hostUserId vide')
  if (channels.length === 0) throw new RangeError('aucun canal')
  if (channels.length > MAX_CHANNELS) throw new RangeError(`plus de ${MAX_CHANNELS} canaux`)
  if (kind === 'dm' && channels.length !== 1) throw new RangeError('un DM n\'a qu\'un canal')

  const members: Record<string, string[]> = {}
  const peers = new Set<string>()

  for (const { id, memberIds } of channels) {
    if (!id) throw new RangeError('identifiant de canal vide')
    // L'hôte est toujours membre de ses canaux (sinon `HostNotInMembers` côté relais)
    const users = new Set([...(members[id] ?? []), hostUserId, ...memberIds])
    members[id] = [...users]
    users.forEach((u) => u !== hostUserId && peers.add(u))
  }

  const { marginRatio, marginMin } = PROFILE_LIMITS[kind]
  const expected = peers.size
  const margin = Math.max(marginMin, Math.ceil(expected * marginRatio))
  const maxConnections = Math.min(MAX_CONNECTIONS_CAP, expected + margin)

  return {
    hostUserId,
    members,
    maxConnections,
    maxPendingHello: Math.min(maxConnections, MAX_PENDING_HELLO_CAP),
  }
}
```

```ts
//apps\web\src\modules\chat\host-profile.test.ts
import { describe, expect, it } from 'vitest'
import { buildHostOptions } from './host-profile'

const users = (n: number) => Array.from({ length: n }, (_, i) => `u${i}`)

describe('buildHostOptions', () => {
  it('DM : 1 pair + marge = 3 connexions', () => {
    const o = buildHostOptions({
      kind: 'dm',
      hostUserId: 'prof',
      channels: [{ id: 'dm1', memberIds: ['prof', 'a'] }],
    })
    expect(o.maxConnections).toBe(3)
    expect(o.maxPendingHello).toBe(3)
  })

  it('classe de 60 : effectif + 20 %, connexions sans hello plafonnées', () => {
    const o = buildHostOptions({
      kind: 'class',
      hostUserId: 'prof',
      channels: [{ id: 'c1', memberIds: users(60) }],
    })
    expect(o.maxConnections).toBe(72)
    expect(o.maxPendingHello).toBe(64)
  })

  it('l\'hôte est ajouté à chaque canal et n\'est pas compté comme pair', () => {
    const o = buildHostOptions({
      kind: 'room',
      hostUserId: 'prof',
      channels: [
        { id: 'c1', memberIds: ['a', 'b'] },
        { id: 'c2', memberIds: ['b', 'c'] },
      ],
    })
    expect(o.members.c1).toContain('prof')
    expect(o.members.c2).toContain('prof')
    expect(o.maxConnections).toBe(3 + 2) // a, b, c + marge minimale
  })

  it('un canal répété fusionne ses membres', () => {
    const o = buildHostOptions({
      kind: 'class',
      hostUserId: 'prof',
      channels: [
        { id: 'c1', memberIds: ['a'] },
        { id: 'c1', memberIds: ['b'] },
      ],
    })
    expect([...o.members.c1].sort()).toEqual(['a', 'b', 'prof'])
  })

  it('le plafond du relais n\'est pas dépassé', () => {
    const o = buildHostOptions({
      kind: 'class',
      hostUserId: 'prof',
      channels: [{ id: 'c1', memberIds: users(1000) }],
    })
    expect(o.maxConnections).toBe(256)
  })

  it('un hôte seul garde au moins la marge minimale', () => {
    const o = buildHostOptions({
      kind: 'room',
      hostUserId: 'prof',
      channels: [{ id: 'c1', memberIds: [] }],
    })
    expect(o.maxConnections).toBe(2)
  })

  it('refuse les profils invalides', () => {
    const ok = { kind: 'class' as const, hostUserId: 'prof', channels: [{ id: 'c1', memberIds: ['a'] }] }
    expect(() => buildHostOptions({ ...ok, hostUserId: '' })).toThrow(RangeError)
    expect(() => buildHostOptions({ ...ok, channels: [] })).toThrow(RangeError)
    expect(() => buildHostOptions({ ...ok, channels: [{ id: '', memberIds: [] }] })).toThrow(RangeError)
    expect(() =>
      buildHostOptions({ ...ok, kind: 'dm', channels: [ok.channels[0], { id: 'c2', memberIds: [] }] }),
    ).toThrow(RangeError)
  })
})
```

---

## 5. Exports des paquets

### `packages/chat/src/index.ts`

À ajouter (les fichiers de `testing/` ne s'exportent pas car ils importent `vitest` et `ws`) :

```ts
export { createTauriWebSocketCtor } from './tauri-websocket'
export type { TauriConnection, TauriMessage, TauriWebSocketPlugin } from './tauri-websocket'
export { createLocalHostTransport } from './local-host-transport'
export type { HostBridge, LocalHostOptions } from './local-host-transport'
export type { WebSocketCtor } from './lan-transport'
```

### `packages/ui` (`src/components/chat/index.ts` / `src/index.ts`)

Réexporter `HubStartOptions` et `HubInfo` partout où `HubController` est réexporté.

---

## 6. Intégration UI et couche applicative

### `packages/ui/src/components/chat/lan/HostLan.tsx`

**1. Remplacer tout le bloc entre `// Frontière avec la couche native…` et l'interface `HostLanProps` incluse :**

```tsx
// Frontière avec la couche native (Tauri) : lance le relais (crates/chat/relay) et connaît
// les adresses locales de l'appareil, que le navigateur ne peut pas obtenir.
export type HubStartOptions = {
  token: string
  port?: number
  // Réglages du profil métier (buildHostOptions), transmis tels quels au relais
  hostUserId?: string
  members?: Record<string, string[]>
  maxConnections?: number
  maxPendingHello?: number
}

// `host` = la meilleure adresse ; `addresses` = tous les choix quand l'appareil en a plusieurs
// (Wi-Fi + partage de connexion, par exemple), la meilleure en premier.
export type HubInfo = { host: string; port: number; addresses?: string[] }

export interface HubController {
  start(options: HubStartOptions): Promise<HubInfo>
  stop(): Promise<void>
  // Relais déjà lancé (retour sur la page) : on retrouve son code au lieu d'en relancer un
  current(): Promise<(HubInfo & { token: string }) | null>
}

type Running = HubInfo & { token: string }

interface HostLanProps {
  hub: HubController
  sessionId: string
  // Réglages du relais calculés par l'app (profil métier) ; le jeton est ajouté ici
  startOptions?: Omit<HubStartOptions, 'token'>
  // Prévenu quand le relais est ouvert OU retrouvé en revenant sur la page : l'appelant doit
  // être idempotent. L'hôte n'y rejoint PAS son propre relais comme client (son identité y est
  // réservée) : il passe par le transport local.
  onStarted?: (info: { host: string; port: number }) => void
  onStopped: () => void
}
```

**2. Remplacer la signature du composant, les `useState`/`useEffect` du début et `start()` (jusqu'à la fin de `start`) :**

```tsx
export function HostLan({ hub, sessionId, startOptions, onStarted, onStopped }: HostLanProps) {
  const [running, setRunning] = useState<Running | null>(null)
  // Adresse choisie pour le QR ; null = la meilleure (running.host)
  const [chosen, setChosen] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    void hub.current().then((current) => {
      if (cancelled || !current) return
      setRunning(current)
      // Le relais tourne déjà : le transport local de l'hôte doit être rattaché (onStarted idempotent)
      onStarted?.({ host: current.host, port: current.port })
    })
    return () => {
      cancelled = true
    }
    // onStarted volontairement absent : on ne relit pas le relais à chaque rendu du parent
  }, [hub]) // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    setBusy(true)
    setError(null)
    try {
      const token = randomToken()
      const info = await hub.start({ ...startOptions, token })
      setRunning({ ...info, token })
      setChosen(null)
      onStarted?.({ host: info.host, port: info.port })
    } catch (e) {
      console.error('Démarrage du relais local impossible:', e)
      setError('Impossible de démarrer le serveur local. Vérifiez que le Wi-Fi est actif et que le port est libre.')
    } finally {
      setBusy(false)
    }
  }
```

**3. Dans `stop()`, ajouter `setChosen(null)` juste après `setRunning(null)`.**

**4. Remplacer la ligne `const link = running ? encodePairing({ ...running, sessionId }) : ''` par :**

```tsx
  // L'adresse choisie doit faire partie des adresses proposées, sinon on retombe sur la meilleure
  const address = running ? (chosen && running.addresses?.includes(chosen) ? chosen : running.host) : ''
  const link = running
    ? encodePairing({ host: address, port: running.port, token: running.token, sessionId })
    : ''
```

**5. Dans la vue « relais ouvert » (`return` final), insérer ce bloc comme premier enfant du `<div className="flex flex-col gap-4">`, avant le fond blanc du QR :**

```tsx
      {running.addresses && running.addresses.length > 1 && (
        <div className="flex flex-col gap-2">
          <label htmlFor="lan-address" className={cn(typography.small, 'font-medium')}>
            Adresse de cet appareil
          </label>
          <select
            id="lan-address"
            value={address}
            onChange={(e) => setChosen(e.target.value)}
            className={cn(typography.small, chat.field, 'self-start')}
          >
            {running.addresses.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <p className={cn(typography.xsmall, 'text-foreground/60')}>
            Choisissez celle du réseau où se trouvent les autres appareils. Le code change avec elle.
          </p>
        </div>
      )}
```

**6. Toujours dans la vue « relais ouvert », ajouter ce paragraphe juste après le `<p role="status" …>` du lien copié :**

```tsx
        <p className={cn(typography.xsmall, 'text-foreground/60')}>
          Si personne ne parvient à rejoindre la séance, autorisez l&apos;application dans le pare-feu
          Windows (réseau privé).
        </p>
```

---

### `apps/web/src/modules/chat/lan/LanPanel.tsx`

**1. Dans l'import de `'@attendancy/ui'`, ajouter cette ligne après `type HubController,` :**

```tsx
  type HubStartOptions,
```

**2. Remplacer l'interface `LanPanelProps` et la signature de `LanPanel` (jusqu'à l'accolade ouvrante incluse, sans dupliquer `const chat_dot`) par :**

```tsx
interface LanPanelProps {
  // Présent seulement sur l'appareil de l'hôte (couche native disponible)
  hub?: HubController
  sessionId?: string
  // Réglages du relais calculés par l'app (profil métier) : transmis tels quels à HostLan
  hostStartOptions?: Omit<HubStartOptions, 'token'>
  // Relais ouvert (ou retrouvé au retour sur la page) / fermé : l'app attache et détache le
  // transport local de l'hôte. onHostStarted doit être idempotent.
  onHostStarted?: (info: { host: string; port: number }) => void
  onHostStopped?: () => void
  // Canaux imposés par le profil métier (classe, salle…) : priment sur ceux du provider
  channels?: string[]
}

const chat_dot = 'inline-block size-2.5 shrink-0 rounded-full border-2'

export function LanPanel({
  hub,
  sessionId,
  hostStartOptions,
  onHostStarted,
  onHostStopped,
  channels,
}: LanPanelProps) {
```

**3. Remplacer la ligne `<HostLan hub={hub} sessionId={sessionId} onStopped={sync.disconnectLan} />` par :**

```tsx
          <HostLan
            hub={hub}
            sessionId={sessionId}
            startOptions={hostStartOptions}
            onStarted={onHostStarted}
            // Le transport local est détaché d'abord, puis la connexion LAN cliente est coupée
            onStopped={() => {
              onHostStopped?.()
              sync.disconnectLan()
            }}
          />
```

---

### `apps/web/src/modules/chat/ChatSyncProvider.tsx`

**1. Dans l'import de `'@attendancy/chat'`, ajouter cette ligne après `type TransportStatus,` :**

```tsx
  type WebSocketCtor,
```

**2. Remplacer de `export function ChatSyncProvider({` jusqu'au premier `useEffect(() => { … })` inclus :**

```tsx
export function ChatSyncProvider({
  user,
  channelIds,
  webSocketImpl,
  children,
}: {
  user: PresenceUser
  channelIds: string[]
  // Client WebSocket du LAN. Absent = celui du navigateur. L'app Tauri passe l'adaptateur du
  // plugin : le WebSocket du navigateur n'est pas fiable pour ws:// vers un appareil local.
  webSocketImpl?: WebSocketCtor
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const [version, setVersion] = useState(0)
  const [lan, setLan] = useState<LanState>(LAN_IDLE)
  const [ctx, setCtx] = useState<Omit<Ctx, 'version' | 'lan'> | null>(null)
  const userRef = useRef(user)
  const channelsRef = useRef(channelIds)
  const webSocketRef = useRef(webSocketImpl)
  const resumeRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    userRef.current = user
    channelsRef.current = channelIds
    webSocketRef.current = webSocketImpl
  })
```

**3. Dans `connectLan`, ajouter cette ligne dans l'appel `createLanTransport({ … })`, juste après `known: () => inbox.knownIds(activeChannels()),` :**

```tsx
        WebSocketImpl: webSocketRef.current,
```

---

### `apps/chat/src/routes/_app/route.tsx`

**1. Ajouter ces imports, après ceux de `@attendancy/user` :**

```tsx
import { isTauri } from "@tauri-apps/api/core";
import WebSocket from "@tauri-apps/plugin-websocket";
import { createTauriWebSocketCtor } from "@attendancy/chat";
```

**2. Ajouter ce bloc entre `export const Route = …` et `function AppLayout()` :**

```tsx
// Dans l'app Tauri, le LAN passe par le plugin natif. Hors Tauri (vite seul, en développement),
// on garde le WebSocket du navigateur.
const webSocketImpl = isTauri() ? createTauriWebSocketCtor(WebSocket) : undefined;
```

**3. Remplacer la ligne ouvrante du provider par :**

```tsx
    <ChatSyncProvider user={presenceUser} channelIds={channelIds} webSocketImpl={webSocketImpl}>
```

---

### `apps/chat/src/routes/_app/local.tsx` (fichier complet)

> Dépend de `@/native/host` (livraison 3) qui doit exporter `tauriHub: HubController` et `tauriHostBridge: HostBridge`.

```tsx
//apps\chat\src\routes\_app\local.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { isTauri } from '@tauri-apps/api/core'
import { useAuthUser } from '@attendancy/auth'
import { createLocalHostTransport } from '@attendancy/chat'
import { LanPanel } from '@/modules/chat/lan/LanPanel'
import { useChatSync } from '@/modules/chat'
// Couche native (livraison 3) : le relais et le pont de l'hôte
import { tauriHostBridge, tauriHub } from '@/native/host'

export const Route = createFileRoute('/_app/local')({
  component: LocalPage,
})

// Hors Tauri (vite seul), pas de relais à ouvrir : seule la partie « rejoindre » s'affiche
const hub = isTauri() ? tauriHub : undefined

function LocalPage() {
  const sync = useChatSync()
  const user = useAuthUser()
  const engine = sync?.engine
  const userId = user?.id

  // Identifiant de la séance, propre à cette visite de la page
  const [sessionId] = useState(() => crypto.randomUUID())

  // Réglages du relais. Le profil métier (buildHostOptions : classe, salle, DM) s'y ajoutera
  // quand les membres des canaux seront disponibles ici ; l'hôte, lui, est déjà connu.
  const hostStartOptions = useMemo(() => (userId ? { hostUserId: userId } : undefined), [userId])

  // Détache le transport local de l'hôte
  const detachRef = useRef<(() => void) | null>(null)

  // Idempotent : appelé à l'ouverture du relais ET quand HostLan le retrouve au retour sur la page
  const attachLocal = useCallback(() => {
    if (!engine || !userId) return
    detachRef.current?.()
    detachRef.current = engine.attach(createLocalHostTransport(tauriHostBridge, { hostUserId: userId }))
  }, [engine, userId])

  const detachLocal = useCallback(() => {
    detachRef.current?.()
    detachRef.current = null
  }, [])

  // Quitter la page détache le transport local ; le relais reste ouvert, et HostLan le retrouve
  // (donc rattache le transport) au retour. Entre-temps, les messages de l'hôte restent dans son
  // outbox et repartent vers le relais au rattachement.
  useEffect(() => detachLocal, [detachLocal])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <LanPanel
        hub={hub}
        sessionId={sessionId}
        hostStartOptions={hostStartOptions}
        onHostStarted={attachLocal}
        onHostStopped={detachLocal}
      />
    </div>
  )
}
```

---

## 7. Mutations de test à vérifier

| Casse volontaire | Test qui doit échouer |
|---|---|
| Retirer le `if (this.finished) return` de `finish()` | contrat « Close du pair / coupure brutale », « deux Close du plugin » |
| Poser `addListener` après `this.onopen?.({})` | « l'écouteur est posé avant onopen » |
| Remplacer le chaînage de `sending` par un appel direct de `connection.send` | « les envois partent dans l'ordre » |
| Retirer le test `if (this.finished)` après `await plugin.connect` | « close() pendant la connexion » (contrat et cas manuel) |
| Inverser `bridge.onMessage` et `catchUp` (lire avant de s'abonner) | « s'abonne avant de lire l'instantané » |
| Supprimer `resyncQueued = true` | « plusieurs Lagged d'affilée » |
| Retirer le test `gen !== generation` dans `catchUp` | « stop pendant l'instantané » |
| Mapper `NotRunning` en `throw new Error(reason)` | « relais arrêté (NotRunning) » |

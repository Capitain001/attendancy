//packages\chat\src\lan-transport.ts
import type { ChatTransport, TransportStatus } from './engine'
import type { Envelope } from './types'

type WebSocketLike = {
  send(data: string): void
  close(): void
  onopen: ((ev: unknown) => void) | null
  onmessage: ((ev: { data: unknown }) => void) | null
  onclose: ((ev: unknown) => void) | null
  onerror: ((ev: unknown) => void) | null
}
export type WebSocketCtor = new (url: string) => WebSocketLike

export type LanOptions = {
  url: string
  token: string
  userId: string
  name?: string
  channels: string[]
  known?: () => Promise<string[]>
  WebSocketImpl?: WebSocketCtor
  ackTimeoutMs?: number
  pingIntervalMs?: number
  // Plafond du délai conseillé par le relais avant de renvoyer un message refusé (défaut 5 s)
  maxRetryDelayMs?: number
  backoff?: { minMs: number; maxMs: number }
}

// Refus définitifs : se reconnecter ne changerait rien
const FATAL = new Set(['bad_token', 'not_member', 'bad_hello', 'author_reserved'])

// Refus `rate_limited` : le relais dit « plus tard ». On renvoie le même message après son délai,
// sans jamais croire un délai démesuré, et on abandonne après quelques essais.
const MAX_RATE_RETRIES = 5
const MAX_RETRY_DELAY_MS = 5_000
const DEFAULT_RETRY_MS = 500

// Nombre maximal d'ids connus envoyés au hello. Le relais refuse un hello trop gros (bad_hello,
// définitif) : au-delà du plafond, mieux vaut recevoir quelques doublons, que l'inbox ignore,
// qu'une panne permanente. On garde les derniers de la liste (les plus récents si elle est
// dans l'ordre d'arrivée).
const MAX_KNOWN_IDS = 500

type Pending = {
  resolve: () => void
  reject: (e: Error) => void
  timer: ReturnType<typeof setTimeout>
  frame: string
  attempts: number
}

export function createLanTransport(opts: LanOptions): ChatTransport {
  const Impl = opts.WebSocketImpl ?? (globalThis as { WebSocket?: WebSocketCtor }).WebSocket
  const ackTimeoutMs = opts.ackTimeoutMs ?? 5000
  const pingMs = opts.pingIntervalMs ?? 20_000
  const maxRetryDelayMs = opts.maxRetryDelayMs ?? MAX_RETRY_DELAY_MS
  const backoff = opts.backoff ?? { minMs: 500, maxMs: 15_000 }

  let ws: WebSocketLike | null = null
  let state: TransportStatus = 'idle'
  let stopped = true
  let fatal = false
  let failure: string | null = null
  let omitted = 0
  let attempt = 0
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let pingTimer: ReturnType<typeof setInterval> | undefined
  let lastSeen = 0
  // Chaque start() ouvre une génération. Toute attente (known(), temporisation de reconnexion)
  // compare la génération qu'elle a capturée : sinon un stop() puis start() pendant l'attente
  // laisserait deux connexions ouvertes, dont une orpheline.
  let generation = 0

  const recvCbs = new Set<(e: Envelope) => void>()
  const statusCbs = new Set<(s: TransportStatus) => void>()
  const acks = new Map<string, Pending>()

  const setState = (s: TransportStatus) => {
    if (state === s) return
    state = s
    statusCbs.forEach((cb) => cb(s))
  }

  function settle(id: string, err?: Error) {
    const a = acks.get(id)
    if (!a) return
    clearTimeout(a.timer)
    acks.delete(id)
    err ? a.reject(err) : a.resolve()
  }

  function failAll(err: Error) {
    for (const id of [...acks.keys()]) settle(id, err)
  }

  // Le relais a refusé trop vite : même trame, après son délai (borné). false = on abandonne.
  function retryLater(id: string, hint: unknown) {
    const p = acks.get(id)
    if (!p || p.attempts >= MAX_RATE_RETRIES) return false
    p.attempts++
    clearTimeout(p.timer)
    const delay = Math.min(typeof hint === 'number' && hint > 0 ? hint : DEFAULT_RETRY_MS, maxRetryDelayMs)
    const gen = generation
    p.timer = setTimeout(() => {
      if (acks.get(id) !== p) return // déjà réglé (connexion perdue entre-temps)
      const sock = ws
      if (gen !== generation || state !== 'connected' || !sock) return settle(id, new Error('closed'))
      p.timer = setTimeout(() => settle(id, new Error('ack_timeout')), ackTimeoutMs)
      try {
        sock.send(p.frame)
      } catch {
        settle(id, new Error('closed'))
      }
    }, delay)
    return true
  }

  const stopPing = () => {
    clearInterval(pingTimer)
    pingTimer = undefined
  }

  // Fermeture traitée UNE fois, qu'elle vienne de onclose ou de la détection de silence.
  // Une socket remplacée ou arrêtée par stop() (ws !== sock) est ignorée.
  function dropped(sock: WebSocketLike, gen: number) {
    if (ws !== sock) return
    ws = null
    stopPing()
    failAll(new Error('closed'))
    if (stopped || fatal) return setState('closed')
    setState('connecting')
    const delay = Math.min(backoff.maxMs, backoff.minMs * 2 ** attempt++)
    retryTimer = setTimeout(() => void connect(gen), delay)
  }

  function startPing(sock: WebSocketLike, gen: number) {
    stopPing()
    lastSeen = Date.now()
    pingTimer = setInterval(() => {
      if (ws !== sock) return stopPing()
      // Silence prolongé : on n'attend pas le close (qui peut tarder), on reconnecte
      if (Date.now() - lastSeen > pingMs * 2.5) {
        sock.onclose = null
        try {
          sock.close()
        } catch {
          /* déjà morte */
        }
        return dropped(sock, gen)
      }
      try {
        sock.send('{"t":"ping"}')
      } catch {
        /* le prochain tour tranchera */
      }
    }, pingMs)
  }

  async function connect(gen: number) {
    if (stopped || gen !== generation) return
    if (!Impl) {
      failure = 'unsupported'
      fatal = true
      return setState('closed')
    }
    setState('connecting')
    const known = (opts.known ? await opts.known().catch(() => []) : []).slice(-MAX_KNOWN_IDS)
    // Après chaque attente : la génération, pas seulement `stopped`
    if (stopped || gen !== generation) return

    let sock: WebSocketLike
    try {
      sock = new Impl(opts.url)
    } catch {
      // Page https qui ouvre ws:// : le navigateur refuse tout de suite
      failure = 'insecure_context'
      fatal = true
      return setState('closed')
    }
    ws = sock

    sock.onopen = () =>
      sock.send(
        JSON.stringify({
          t: 'hello',
          token: opts.token,
          userId: opts.userId,
          name: opts.name ?? null,
          channels: opts.channels,
          known,
        }),
      )

    sock.onmessage = (ev) => {
      lastSeen = Date.now() // toute trame prouve que le relais est vivant
      let f: { t?: string; [k: string]: unknown }
      try {
        f = JSON.parse(String(ev.data))
      } catch {
        return
      }
      if (f.t === 'welcome') {
        attempt = 0
        omitted = typeof f.omitted === 'number' && f.omitted > 0 ? f.omitted : 0
        startPing(sock, gen)
        for (const env of (f.backlog as Envelope[] | undefined) ?? []) recvCbs.forEach((cb) => cb(env))
        setState('connected')
      } else if (f.t === 'msg') {
        recvCbs.forEach((cb) => cb(f.env as Envelope))
      } else if (f.t === 'ack') {
        settle(String(f.id))
      } else if (f.t === 'reject') {
        if (f.id) {
          const id = String(f.id)
          if (f.reason === 'rate_limited' && retryLater(id, f.retryAfterMs)) return
          settle(id, new Error(String(f.reason)))
        } else if (FATAL.has(String(f.reason))) {
          // Un rejet sans id ne ferme que s'il est fatal : un simple « bad_frame » ne doit pas
          // provoquer une boucle de reconnexion
          fatal = true
          failure = String(f.reason)
          sock.close()
        }
      }
    }

    sock.onerror = () => {}
    sock.onclose = () => dropped(sock, gen)
  }

  return {
    name: 'lan',
    status: () => state,
    failure: () => failure,
    omitted: () => omitted,
    start() {
      if (!stopped) return
      stopped = false
      fatal = false
      failure = null
      omitted = 0
      attempt = 0
      generation++
      void connect(generation)
    },
    stop() {
      stopped = true
      omitted = 0
      generation++
      clearTimeout(retryTimer)
      stopPing()
      const sock = ws
      ws = null
      sock?.close()
      failAll(new Error('stopped'))
      setState('closed')
    },
    send(env) {
      const sock = ws
      if (state !== 'connected' || !sock) return Promise.reject(new Error('not_connected'))
      return new Promise<void>((resolve, reject) => {
        const frame = JSON.stringify({ t: 'msg', env })
        const timer = setTimeout(() => settle(env.id, new Error('ack_timeout')), ackTimeoutMs)
        acks.set(env.id, { resolve, reject, timer, frame, attempts: 0 })
        sock.send(frame)
      })
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
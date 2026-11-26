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
  backoff?: { minMs: number; maxMs: number }
  pingIntervalMs?: number
}

const FATAL = new Set(['bad_token', 'not_member', 'bad_hello'])

export function createLanTransport(opts: LanOptions): ChatTransport {
  const Impl = opts.WebSocketImpl ?? (globalThis as { WebSocket?: WebSocketCtor }).WebSocket
  const ackTimeoutMs = opts.ackTimeoutMs ?? 5000
  const backoff = opts.backoff ?? { minMs: 500, maxMs: 15_000 }
  const pingMs = opts.pingIntervalMs ?? 20_000

  let ws: WebSocketLike | null = null
  let state: TransportStatus = 'idle'
  let stopped = true
  let fatal = false
  let failure: string | null = null
  let attempt = 0
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let pingTimer: ReturnType<typeof setInterval> | undefined
  let lastSeen = 0

  const recvCbs = new Set<(e: Envelope) => void>()
  const statusCbs = new Set<(s: TransportStatus) => void>()
  const acks = new Map<
    string,
    { resolve: () => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }
  >()

  const setState = (s: TransportStatus) => {
    if (state === s) return
    state = s
    statusCbs.forEach((cb) => cb(s))
  }

  const stopPing = () => {
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = undefined
    }
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
      // Silence prolongé : on n'attend pas le close (qui peut tarder), on reconnecte
      if (Date.now() - lastSeen > pingMs * 2.5) {
        sock.onclose = null
        try {
          sock.close()
        } catch {
          /* déjà mort */
        }
        return dropped(sock)
      }
      try {
        sock.send('{"t":"ping"}')
      } catch {
        /* le prochain tour tranchera */
      }
    }, pingMs)
  }

  async function connect() {
    if (stopped) return
    if (!Impl) {
      failure = 'unsupported'
      fatal = true
      return setState('closed')
    }
    setState('connecting')
    const known = opts.known ? await opts.known().catch(() => []) : []
    if (stopped) return

    let sock: WebSocketLike
    try {
      sock = new Impl(opts.url)
    } catch {
      // Page https qui ouvre ws:// : le navigateur refuse immédiatement
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
      lastSeen = Date.now() // toute trame prouve que le hub est vivant
      let f: { t?: string; [k: string]: unknown }
      try {
        f = JSON.parse(String(ev.data))
      } catch {
        return
      }
      if (f.t === 'welcome') {
        attempt = 0
        startPing(sock)
        for (const env of (f.backlog as Envelope[] | undefined) ?? []) recvCbs.forEach((cb) => cb(env))
        setState('connected')
      } else if (f.t === 'msg') {
        recvCbs.forEach((cb) => cb(f.env as Envelope))
      } else if (f.t === 'ack') {
        settle(String(f.id))
      } else if (f.t === 'reject') {
        if (f.id) settle(String(f.id), new Error(String(f.reason)))
        // Un rejet sans id ne ferme que s'il est fatal : un simple bad_frame ne doit pas
        // provoquer une boucle de reconnexion
        else if (FATAL.has(String(f.reason))) {
          fatal = true
          failure = String(f.reason)
          sock.close()
        }
      }
    }

    sock.onerror = () => {}
    sock.onclose = () => dropped(sock)
  }

  return {
    name: 'lan',
    status: () => state,
    failure: () => failure,
    start() {
      if (!stopped) return
      stopped = false
      fatal = false
      failure = null
      attempt = 0
      void connect()
    },
    stop() {
      stopped = true
      stopPing()
      clearTimeout(retryTimer)
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
        const timer = setTimeout(() => settle(env.id, new Error('ack_timeout')), ackTimeoutMs)
        acks.set(env.id, { resolve, reject, timer })
        sock.send(JSON.stringify({ t: 'msg', env }))
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

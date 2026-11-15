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
}

const FATAL = new Set(['bad_token', 'not_member', 'bad_hello'])

export function createLanTransport(opts: LanOptions): ChatTransport {
  const Impl = opts.WebSocketImpl ?? (globalThis as { WebSocket?: WebSocketCtor }).WebSocket
  const ackTimeoutMs = opts.ackTimeoutMs ?? 5000
  const backoff = opts.backoff ?? { minMs: 500, maxMs: 15_000 }

  let ws: WebSocketLike | null = null
  let state: TransportStatus = 'idle'
  let stopped = true
  let fatal = false
  let attempt = 0
  let retryTimer: ReturnType<typeof setTimeout> | undefined

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

  async function connect() {
    if (stopped || !Impl) return
    setState('connecting')
    const known = opts.known ? await opts.known().catch(() => []) : []
    if (stopped) return

    const sock = new Impl(opts.url)
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
      let f: { t?: string; [k: string]: unknown }
      try {
        f = JSON.parse(String(ev.data))
      } catch {
        return
      }
      if (f.t === 'welcome') {
        attempt = 0
        for (const env of (f.backlog as Envelope[] | undefined) ?? []) recvCbs.forEach((cb) => cb(env))
        setState('connected')
      } else if (f.t === 'msg') {
        recvCbs.forEach((cb) => cb(f.env as Envelope))
      } else if (f.t === 'ack') {
        settle(String(f.id))
      } else if (f.t === 'reject') {
        if (f.id) settle(String(f.id), new Error(String(f.reason)))
        else {
          fatal = FATAL.has(String(f.reason))
          sock.close()
        }
      }
    }

    sock.onerror = () => {}
    sock.onclose = () => {
      if (ws === sock) ws = null
      failAll(new Error('closed'))
      if (stopped || fatal) return setState('closed')
      setState('connecting')
      const delay = Math.min(backoff.maxMs, backoff.minMs * 2 ** attempt++)
      retryTimer = setTimeout(() => void connect(), delay)
    }
  }

  return {
    name: 'lan',
    status: () => state,
    start() {
      if (!stopped) return
      stopped = false
      fatal = false
      void connect()
    },
    stop() {
      stopped = true
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

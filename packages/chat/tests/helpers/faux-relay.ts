//packages\chat\tests\helpers\faux-relay.ts
// Faux relais : seulement pour ce qu'un vrai relais ne peut pas produire
// (trame mal formée, silence prolongé, ack retardé, délai imposé). La conformité du protocole
// se vérifie sur le vrai relais (crates/chat/relay/tests et e2e-relay.test.ts).
import { WebSocketServer, type WebSocket } from 'ws'

export type Frame = { t: string; [k: string]: unknown }

export type Behavior = {
  // Réponse au hello : 'welcome' (défaut), 'silent', ou un refus
  hello?: (ws: WebSocket, frame: Frame) => 'welcome' | 'silent' | { reject: string }
  // Réponse à chaque message : 'ack' (défaut) ou 'silent'. `n` = rang de cette réception pour cet id
  msg?: (ws: WebSocket, frame: Frame, n: number) => 'ack' | 'silent' | { reject: string; retryAfterMs?: number }
  welcome?: Record<string, unknown> // champs ajoutés au welcome (ex. { omitted: 7 })
  pong?: boolean // répondre aux pings (défaut : oui)
}

export async function fauxRelay(behavior: Behavior = {}) {
  const wss = new WebSocketServer({ port: 0, host: '127.0.0.1' })
  await new Promise<void>((ok) => wss.once('listening', () => ok()))
  const port = (wss.address() as { port: number }).port

  const sockets = new Set<WebSocket>()
  const frames: Frame[] = []
  const perId = new Map<string, number>()
  let connections = 0

  wss.on('connection', (ws) => {
    connections++
    sockets.add(ws)
    ws.on('close', () => sockets.delete(ws))
    ws.on('message', (raw) => {
      const f = JSON.parse(String(raw)) as Frame
      frames.push(f)
      if (f.t === 'hello') {
        const r = behavior.hello?.(ws, f) ?? 'welcome'
        if (r === 'welcome') {
          ws.send(JSON.stringify({ t: 'welcome', backlog: [], peers: 1, ...behavior.welcome }))
        } else if (typeof r === 'object') ws.send(JSON.stringify({ t: 'reject', id: null, reason: r.reject }))
      } else if (f.t === 'msg') {
        const id = String((f.env as { id: string }).id)
        const n = (perId.get(id) ?? 0) + 1
        perId.set(id, n)
        const r = behavior.msg?.(ws, f, n) ?? 'ack'
        if (r === 'ack') ws.send(JSON.stringify({ t: 'ack', id, dup: false }))
        else if (typeof r === 'object') {
          ws.send(JSON.stringify({ t: 'reject', id, reason: r.reject, retryAfterMs: r.retryAfterMs }))
        }
      } else if (f.t === 'ping' && behavior.pong !== false) {
        ws.send('{"t":"pong"}')
      }
    })
  })

  return {
    url: `ws://127.0.0.1:${port}`,
    sockets,
    frames,
    count: (t: string) => frames.filter((f) => f.t === t).length,
    get connections() {
      return connections
    },
    send: (f: unknown) => sockets.forEach((s) => s.send(JSON.stringify(f))),
    async close() {
      sockets.forEach((s) => s.terminate())
      await new Promise<void>((ok) => wss.close(() => ok()))
    },
  }
}

export async function waitFor(cond: () => boolean | Promise<boolean>, ms = 3000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (await cond()) return
    await new Promise((r) => setTimeout(r, 15))
  }
  throw new Error('waitFor: délai dépassé')
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
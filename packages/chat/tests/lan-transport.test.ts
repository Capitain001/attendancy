//packages\chat\tests\lan-transport.test.ts
import WebSocket from 'ws'
import { afterEach, describe, expect, it } from 'vitest'
import { createLanTransport, type Envelope, type WebSocketCtor } from '../src'
import { fauxRelay, sleep, waitFor } from './helpers/faux-relay'

const WS = WebSocket as unknown as WebSocketCtor
const CHANNEL = '11111111-1111-4111-8111-111111111111'
const env = (id: string): Envelope => ({
  v: 1, id, channelId: CHANNEL, authorId: 'u1', content: 'x', createdAt: new Date().toISOString(),
})

let relay: Awaited<ReturnType<typeof fauxRelay>> | undefined
let transport: ReturnType<typeof createLanTransport> | undefined

afterEach(async () => {
  transport?.stop()
  await relay?.close()
  relay = transport = undefined
})

async function connected(behavior: Parameters<typeof fauxRelay>[0] = {}, over: Partial<Parameters<typeof createLanTransport>[0]> = {}) {
  relay = await fauxRelay(behavior)
  transport = createLanTransport({
    url: relay.url, token: 't', userId: 'u1', channels: [CHANNEL], WebSocketImpl: WS,
    backoff: { minMs: 30, maxMs: 100 }, ...over,
  })
  return { relay, transport }
}

describe('cycle de vie', () => {
  it('start() est idempotent : un seul appel de connexion', async () => {
    const { relay, transport } = await connected()
    transport.start()
    transport.start()
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    await sleep(100)
    expect(relay.connections).toBe(1)
  })

  it('stop() puis start() : une seule connexion, la précédente est bien fermée', async () => {
    const { relay, transport } = await connected()
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    transport.stop()
    expect(transport.status()).toBe('closed')
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    await waitFor(() => relay.sockets.size === 1)
    expect(relay.connections).toBe(2)
  })

  it("stop() puis start() PENDANT l'attente de known() : une seule connexion, aucune orpheline", async () => {
    const slowKnown = () => new Promise<string[]>((ok) => setTimeout(() => ok([]), 150))
    const { relay, transport } = await connected({}, { known: slowKnown })

    transport.start() // connexion n°1, bloquée sur known()
    await sleep(20)
    transport.stop()
    transport.start() // connexion n°2, aussi sur known()

    await waitFor(() => transport.status() === 'connected')
    await sleep(300) // laisse la n°1 se réveiller si elle le peut
    expect(relay.connections, 'une seule socket doit avoir été ouverte').toBe(1)
    expect(relay.sockets.size).toBe(1)
  })

  it('stop() pendant known() : aucune connexion ne s\'ouvre', async () => {
    const slowKnown = () => new Promise<string[]>((ok) => setTimeout(() => ok([]), 100))
    const { relay, transport } = await connected({}, { known: slowKnown })
    transport.start()
    await sleep(20)
    transport.stop()
    await sleep(250)
    expect(relay.connections).toBe(0)
    expect(transport.status()).toBe('closed')
  })

  it("constructeur WebSocket qui lève (page https) : refus définitif nommé, pas d'état bloqué", async () => {
    const Throwing = class { constructor() { throw new DOMException('blocked', 'SecurityError') } } as unknown as WebSocketCtor
    transport = createLanTransport({ url: 'ws://192.168.1.2:1', token: 't', userId: 'u1', channels: [], WebSocketImpl: Throwing })
    transport.start()
    await waitFor(() => transport!.status() === 'closed')
    expect(transport.failure?.()).toBe('insecure_context')
  })
})

describe('refus du relais', () => {
  it.each(['bad_token', 'not_member', 'bad_hello', 'author_reserved'])('%s : définitif, exposé, sans boucle de reconnexion', async (reason) => {
    const { relay, transport } = await connected({ hello: () => ({ reject: reason }) })
    transport.start()
    await waitFor(() => transport.status() === 'closed')
    await sleep(300) // plusieurs délais de reconnexion s'écouleraient
    expect(transport.failure?.()).toBe(reason)
    expect(relay.connections).toBe(1)
  })

  it('un rejet sans id non fatal (bad_frame) laisse la connexion ouverte', async () => {
    const { relay, transport } = await connected()
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    relay.send({ t: 'reject', id: null, reason: 'bad_frame' })
    await sleep(150)
    expect(transport.status()).toBe('connected')
    expect(relay.connections).toBe(1)
  })

  it('start() après un refus définitif repart de zéro', async () => {
    let refuse = true
    const { relay, transport } = await connected({ hello: () => (refuse ? { reject: 'bad_token' } : 'welcome') })
    transport.start()
    await waitFor(() => transport.status() === 'closed')
    refuse = false
    transport.stop()
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    expect(transport.failure?.()).toBeNull()
    expect(relay.connections).toBe(2)
  })
})

describe('envoi et accusés', () => {
  it('send() hors connexion est refusé tout de suite', async () => {
    const { transport } = await connected()
    await expect(transport.send(env('a'))).rejects.toThrow('not_connected')
  })

  it('accusé manquant : ack_timeout', async () => {
    const { transport } = await connected({ msg: () => 'silent' }, { ackTimeoutMs: 100 })
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    await expect(transport.send(env('a'))).rejects.toThrow('ack_timeout')
  })

  it('connexion perdue pendant un envoi : refusé (closed), pas suspendu', async () => {
    const { relay, transport } = await connected({ msg: () => 'silent' }, { ackTimeoutMs: 5000 })
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    const pending = transport.send(env('a'))
    await sleep(30)
    relay.sockets.forEach((s) => s.terminate())
    await expect(pending).rejects.toThrow('closed')
  })

  it('se reconnecte après une coupure, avec un délai croissant', async () => {
    const { relay, transport } = await connected()
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    relay.sockets.forEach((s) => s.terminate())
    await waitFor(() => relay.connections === 2 && transport.status() === 'connected')
  })
})

describe('refus « rate_limited » : le relais dit plus tard', () => {
  it('renvoie le même message après le délai conseillé, une seule promesse', async () => {
    const { relay, transport } = await connected({
      msg: (_ws, _f, n) => (n === 1 ? { reject: 'rate_limited', retryAfterMs: 120 } : 'ack'),
    })
    transport.start()
    await waitFor(() => transport.status() === 'connected')

    const t0 = Date.now()
    await transport.send(env('a'))
    const elapsed = Date.now() - t0

    expect(elapsed).toBeGreaterThanOrEqual(100)
    expect(relay.count('msg')).toBe(2)
    expect((relay.frames.filter((f) => f.t === 'msg')[1]!.env as Envelope).id).toBe('a')
  })

  it('abandonne après plusieurs refus : le message reste à renvoyer plus tard', async () => {
    const { relay, transport } = await connected({ msg: () => ({ reject: 'rate_limited', retryAfterMs: 10 }) })
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    await expect(transport.send(env('a'))).rejects.toThrow('rate_limited')
    expect(relay.count('msg')).toBe(1 + 5) // l'envoi initial + 5 réessais
  })

  it("un délai conseillé démesuré est plafonné : on ne croit pas aveuglément le relais", async () => {
    const { relay, transport } = await connected(
      { msg: (_ws, _f, n) => (n === 1 ? { reject: 'rate_limited', retryAfterMs: 600_000 } : 'ack') },
      { maxRetryDelayMs: 150 },
    )
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    const t0 = Date.now()
    await transport.send(env('a'))
    expect(Date.now() - t0).toBeLessThan(1000)
    expect(relay.count('msg')).toBe(2)
  })

  it("sans délai conseillé, un délai par défaut s'applique", async () => {
    const { relay, transport } = await connected({
      msg: (_ws, _f, n) => (n === 1 ? { reject: 'rate_limited' } : 'ack'),
    })
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    const t0 = Date.now()
    await transport.send(env('a'))
    expect(Date.now() - t0).toBeGreaterThanOrEqual(450)
    expect(relay.count('msg')).toBe(2)
  })

  it("la connexion coupée pendant l'attente du délai : refusé (closed), pas de renvoi fantôme", async () => {
    const { relay, transport } = await connected({ msg: () => ({ reject: 'rate_limited', retryAfterMs: 300 }) })
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    const pending = transport.send(env('a'))
    pending.catch(() => {})
    await sleep(50)
    relay.sockets.forEach((s) => s.terminate())
    await expect(pending).rejects.toThrow('closed')
    await sleep(450)
    expect(relay.count('msg')).toBe(1)
  })

  it('un autre refus avec id (not_member) reste définitif pour ce message, sans réessai', async () => {
    const { relay, transport } = await connected({ msg: () => ({ reject: 'not_member' }) })
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    await expect(transport.send(env('a'))).rejects.toThrow('not_member')
    expect(relay.count('msg')).toBe(1)
  })
})

describe('détection de silence', () => {
  it("un relais qui ne répond plus aux pings : connexion abandonnée puis rétablie", async () => {
    const { relay, transport } = await connected({}, { pingIntervalMs: 40 })
    transport.start()
    await waitFor(() => transport.status() === 'connected')
    // le relais cesse de répondre (sans fermer la socket : connexion « à moitié morte »)
    const original = relay.sockets.values().next().value!
    original.removeAllListeners('message')

    await waitFor(() => relay.connections >= 2, 3000)
    await waitFor(() => transport.status() === 'connected', 3000)
  })
})

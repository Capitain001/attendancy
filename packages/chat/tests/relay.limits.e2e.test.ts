//packages\chat\tests\relay.limits.e2e.test.ts
// Transport TypeScript contre le VRAI relais : débit, identité de l'hôte, arrêt propre.
import { type ChildProcess, spawn } from 'node:child_process'
import WebSocket from 'ws'
import { afterEach, describe, expect, it } from 'vitest'
import { createLanTransport, type Envelope, type WebSocketCtor } from '../src'
import { createRelayHost, defaultRelayBin } from '../src/relay-host'
import { sleep, waitFor } from './helpers/faux-relay'

const WS = WebSocket as unknown as WebSocketCtor
const CHANNEL = '11111111-1111-4111-8111-111111111111'

const hosts: ReturnType<typeof createRelayHost>[] = []
const procs: ChildProcess[] = []
const transports: { stop(): void }[] = []
afterEach(async () => {
  transports.splice(0).forEach((t) => t.stop())
  procs.splice(0).forEach((p) => p.kill())
  await Promise.all(hosts.splice(0).map((h) => h.stop()))
})

async function relay(o: { hostUserId?: string; extraArgs?: string[] } = {}) {
  const host = createRelayHost()
  hosts.push(host)
  const { url } = await host.start({ token: 'tok', ...o })
  return { url }
}

function lan(url: string, userId: string) {
  const t = createLanTransport({
    url, token: 'tok', userId, name: userId, channels: [CHANNEL], WebSocketImpl: WS,
    backoff: { minMs: 50, maxMs: 200 },
  })
  transports.push(t)
  return t
}

const env = (id: string, author: string): Envelope => ({
  v: 1, id, channelId: CHANNEL, authorId: author, content: `contenu ${id}`, createdAt: new Date().toISOString(),
})
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

describe('transport TypeScript contre le vrai relais', () => {
  it("rafale au-delà du débit, envoyée comme le moteur le fait (un message après l'autre) : aucun message perdu", async () => {
    const { url } = await relay({ extraArgs: ['--rate-burst', '2', '--rate-per-sec', '10'] })
    const a = lan(url, 'alice')
    const b = lan(url, 'bob')
    const got = new Set<string>()
    b.onReceive((e) => got.add(e.id))
    a.start()
    b.start()
    await waitFor(() => a.status() === 'connected' && b.status() === 'connected')

    // 8 messages d'affilée : les 2 premiers passent, les autres sont refusés (`rate_limited`)
    // puis renvoyés par le transport après le délai conseillé.
    const ids = Array.from({ length: 8 }, (_, i) => uid(i + 1))
    const t0 = Date.now()
    for (const id of ids) await a.send(env(id, 'alice'))
    const elapsed = Date.now() - t0

    await waitFor(() => got.size === ids.length, 5000)
    expect([...got].sort()).toEqual([...ids].sort())
    // preuve que le limiteur a bien joué : 6 messages à 10/s ne tiennent pas en moins de ~400 ms
    expect(elapsed).toBeGreaterThanOrEqual(400)
  })

  it("identité de l'hôte : le relais refuse un client qui la porte, définitivement", async () => {
    const { url } = await relay({ hostUserId: 'prof' })
    const imposteur = lan(url, 'prof')
    imposteur.start()
    await waitFor(() => imposteur.status() === 'closed')
    await sleep(400)
    expect(imposteur.status()).toBe('closed')
    expect(imposteur.failure?.()).toBe('author_reserved')

    // un autre utilisateur n'est pas concerné
    const eleve = lan(url, 'eleve')
    eleve.start()
    await waitFor(() => eleve.status() === 'connected')
  })

  it.skipIf(process.platform === 'win32')("arrêt du relais (SIGINT) : trame Close « Away » reçue, processus terminé proprement", async () => {
    const proc = spawn(defaultRelayBin(), ['--token', 'tok', '--bind', '127.0.0.1', '--port', '0'])
    procs.push(proc)
    const url = await new Promise<string>((ok, ko) => {
      proc.stdout!.on('data', (d) => {
        const m = /LISTENING (\S+)/.exec(String(d))
        if (m) ok(`ws://${m[1]}`)
      })
      setTimeout(() => ko(new Error('relais muet')), 5000)
    })
    const exited = new Promise<number | null>((ok) => proc.once('exit', (code) => ok(code)))

    const ws = new WebSocket(url)
    const closed = new Promise<number>((ok) => ws.once('close', (code) => ok(code)))
    await new Promise<void>((ok) => ws.once('open', () => ok()))
    ws.send(JSON.stringify({ t: 'hello', token: 'tok', userId: 'a', channels: [CHANNEL], known: [] }))
    await new Promise<void>((ok) => ws.once('message', () => ok())) // welcome

    proc.kill('SIGINT')
    expect(await closed).toBe(1001) // « going away » : fermeture voulue, pas une coupure
    expect(await exited).toBe(0)
  })
})

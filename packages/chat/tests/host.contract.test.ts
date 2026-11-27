//packages\chat\tests\host.contract.test.ts
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import WebSocket from 'ws'
import { afterEach, describe, expect, it } from 'vitest'
import { createRelayHost, RelayHostError } from '../src/relay-host'
import { waitFor } from './helpers/faux-relay'

const CHANNEL = '11111111-1111-4111-8111-111111111111'
const hosts: ReturnType<typeof createRelayHost>[] = []
const mk = () => {
  const h = createRelayHost()
  hosts.push(h)
  return h
}
afterEach(async () => {
  await Promise.all(hosts.splice(0).map((h) => h.stop()))
})

const code = (p: Promise<unknown>) =>
  p.then(
    () => null,
    (e) => (e instanceof RelayHostError ? e.code : e),
  )

function handshake(url: string) {
  return new Promise<string>((ok, ko) => {
    const ws = new WebSocket(url)
    ws.once('error', ko)
    ws.once('open', () =>
      ws.send(JSON.stringify({ t: 'hello', token: 'tok', userId: 'a', channels: [CHANNEL], known: [] })),
    )
    ws.once('message', (d) => {
      ws.close()
      ok(String(JSON.parse(String(d)).t))
    })
  })
}

describe('hostContract', () => {
  it('écoute sur un port réel et répond au hello', async () => {
    const h = mk()
    const { port, url } = await h.start({ token: 'tok' })
    expect(port).toBeGreaterThan(0)
    expect(h.running).toBe(true)
    expect(await handshake(url)).toBe('welcome')
  })

  it('stop() puis start() est autorisé', async () => {
    const h = mk()
    await h.start({ token: 'tok' })
    await h.stop()
    expect(h.running).toBe(false)
    const again = await h.start({ token: 'tok' })
    expect(await handshake(again.url)).toBe('welcome')
  })

  it('stop() est idempotent, même sans start()', async () => {
    const h = mk()
    await h.stop()
    await h.start({ token: 'tok' })
    await h.stop()
    await h.stop()
    expect(h.running).toBe(false)
  })

  it('second start() actif : AlreadyStarted', async () => {
    const h = mk()
    await h.start({ token: 'tok' })
    expect(await code(h.start({ token: 'tok' }))).toBe('AlreadyStarted')
    expect(h.running).toBe(true)
  })

  it('hostUserId absent de members : HostNotInMembers, rien n’est lancé', async () => {
    const h = mk()
    expect(await code(h.start({ token: 'tok', hostUserId: 'prof', members: { [CHANNEL]: ['eleve'] } }))).toBe(
      'HostNotInMembers',
    )
    expect(h.running).toBe(false)
  })

  it('hostUserId présent dans members : démarre', async () => {
    const h = mk()
    await h.start({ token: 'tok', hostUserId: 'prof', members: { [CHANNEL]: ['prof', 'eleve'] } })
    expect(h.running).toBe(true)
  })

  it('port occupé : erreur typée, état propre, redémarrage possible', async () => {
    const blocker = createServer()
    await new Promise<void>((ok) => blocker.listen(0, '127.0.0.1', () => ok()))
    const busy = (blocker.address() as { port: number }).port
    try {
      const h = mk()
      expect(await code(h.start({ token: 'tok', port: busy }))).toBe('PortInUse')
      expect(h.running).toBe(false)
      await h.start({ token: 'tok' }) // port libre : ça repart
      expect(h.running).toBe(true)
    } finally {
      await new Promise((ok) => blocker.close(ok))
    }
  })

  it('stop() pendant start() : StoppedDuringStart, état propre', async () => {
    const h = mk()
    const p = code(h.start({ token: 'tok' }))
    await h.stop()
    expect(await p).toBe('StoppedDuringStart')
    expect(h.running).toBe(false)
    await h.start({ token: 'tok' }) // un start() enchaîné repart
    expect(h.running).toBe(true)
  })

  it('deux start() simultanés : un seul réussit', async () => {
    const h = mk()
    const r = await Promise.all([code(h.start({ token: 'tok' })), code(h.start({ token: 'tok' }))])
    expect(r).toEqual([null, 'AlreadyStarted'])
    expect(h.running).toBe(true)
  })

  it('process tué de l’extérieur : running repasse à false, puis start() refonctionne', async () => {
    const h = mk()
    await h.start({ token: 'tok' })
    process.kill(h.pid!)
    await waitFor(() => !h.running)
    expect(h.info).toBeNull()
    await h.start({ token: 'tok' })
    expect(h.running).toBe(true)
  })

  it('options invalides : BadOptions, rien n’est lancé', async () => {
    const h = mk()
    expect(await code(h.start({ token: '' }))).toBe('BadOptions')
    expect(await code(h.start({ token: 'tok', port: -1 }))).toBe('BadOptions')
    expect(await code(h.start({ token: 'tok', port: 70000 }))).toBe('BadOptions')
    expect(await code(h.start({ token: 'tok', maxConnections: 0 }))).toBe('BadOptions')
    expect(h.running).toBe(false)
  })

  it('fichier des membres : supprimé dès LISTENING', async () => {
    const h = mk()
    await h.start({ token: 'tok', members: { [CHANNEL]: ['prof'] } })
    const path = h.membersFile!
    expect(existsSync(path)).toBe(false)
    expect(h.running).toBe(true)
  })

  it('fichier des membres supprimé aussi quand le démarrage échoue', async () => {
    const blocker = createServer()
    await new Promise<void>((ok) => blocker.listen(0, '127.0.0.1', () => ok()))
    const busy = (blocker.address() as { port: number }).port
    try {
      const h = mk()
      expect(await code(h.start({ token: 'tok', port: busy, members: { [CHANNEL]: ['a'] } }))).toBe('PortInUse')
      expect(existsSync(h.membersFile!)).toBe(false)
    } finally {
      await new Promise((ok) => blocker.close(ok))
    }
  })

  it('option refusée par le relais (extraArgs) : BadOptions', async () => {
    const h = mk()
    expect(await code(h.start({ token: 'tok', extraArgs: ['--rate-burst', '0'] }))).toBe('BadOptions')
    expect(await code(h.start({ token: 'tok', extraArgs: ['--xxx', '1'] }))).toBe('BadOptions')
    expect(h.running).toBe(false)
  })

  it('adresse inexistante sur cet appareil : AddressNotAvailable', async () => {
    const h = mk()
    expect(await code(h.start({ token: 'tok', bind: '203.0.113.77' }))).toBe('AddressNotAvailable')
    expect(h.running).toBe(false)
  })

  it('start() lancé pendant un stop() attend la fin de l’arrêt', async () => {
    const h = mk()
    const first = await h.start({ token: 'tok' })
    const stopped = h.stop()
    const again = await h.start({ token: 'tok', port: first.port })
    await stopped
    expect(h.running).toBe(true)
    expect(again.port).toBe(first.port)
  })
})

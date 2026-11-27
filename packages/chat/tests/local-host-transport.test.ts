//packages\chat\tests\local-host-transport.test.ts
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

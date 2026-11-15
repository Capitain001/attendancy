import { describe, expect, it } from 'vitest'
import {
  clampSentAt,
  createChatSync,
  createInbox,
  createOutbox,
  decodePairing,
  encodePairing,
  mergeMessages,
  memoryStore,
  type Envelope,
  type OutboxItem,
  type SendResult,
} from '../src'

const NOW = new Date('2026-10-26T12:00:00.000Z')

function setup(userId = 'u1', send?: (i: OutboxItem) => Promise<SendResult>) {
  const outboxStore = memoryStore<OutboxItem>()
  const outbox = createOutbox({ store: outboxStore, userId })
  const inbox = createInbox({ store: memoryStore(), now: () => NOW })
  let n = 0
  const calls: string[] = []
  const sync = createChatSync({
    userId,
    outbox,
    inbox,
    now: () => NOW,
    newId: () => `id-${++n}`,
    sendToServer:
      send ??
      (async (i) => {
        calls.push(i.id)
        return { data: i }
      }),
  })
  return { sync, outbox, inbox, outboxStore, calls }
}

describe('clampSentAt', () => {
  it('garde l\'heure d\'écriture hors ligne', () => {
    const t = new Date('2026-10-26T10:00:00.000Z')
    expect(clampSentAt({ sentAt: t.toISOString(), now: NOW }).getTime()).toBe(t.getTime())
  })
  it('refuse le futur', () => {
    expect(clampSentAt({ sentAt: '2027-01-01T00:00:00Z', now: NOW }).getTime()).toBe(NOW.getTime())
  })
  it('plafonne à 7 jours en arrière', () => {
    const r = clampSentAt({ sentAt: '2026-09-01T00:00:00Z', now: NOW })
    expect(r.getTime()).toBe(NOW.getTime() - 7 * 86_400_000)
  })
  it('date invalide ou absente = now', () => {
    expect(clampSentAt({ sentAt: 'nimporte', now: NOW })).toBe(NOW)
    expect(clampSentAt({ now: NOW })).toBe(NOW)
  })
})

describe('outbox + flush', () => {
  it('envoie dans l\'ordre d\'écriture et vide l\'outbox', async () => {
    const { sync, outbox, calls } = setup()
    await sync.send({ channelId: 'c', content: 'un' })
    await sync.send({ channelId: 'c', content: 'deux' })
    await sync.flush()
    expect(calls).toEqual(['id-1', 'id-2'])
    expect(await outbox.list()).toEqual([])
  })

  it('réseau KO : le message reste pending, repart plus tard', async () => {
    let online = false
    const sent: string[] = []
    const { sync, outbox } = setup('u1', async (i) => {
      if (!online) throw new TypeError('fetch failed')
      sent.push(i.id)
      return { data: 1 }
    })
    await sync.send({ channelId: 'c', content: 'hors ligne' })
    await sync.flush()
    expect((await outbox.list())[0]?.status).toBe('pending')
    online = true
    const r = await sync.flush()
    expect(r.sent).toBe(1)
    expect(sent).toEqual(['id-1'])
    expect(await outbox.list()).toEqual([])
  })

  it('refus serveur : failed, pas de retry auto, retry manuel', async () => {
    let ok = false
    const { sync, outbox } = setup('u1', async () => (ok ? { data: 1 } : { error: 'Accès refusé' }))
    await sync.send({ channelId: 'c', content: 'x' })
    await sync.flush()
    const [item] = await outbox.list()
    expect(item).toMatchObject({ status: 'failed', error: 'Accès refusé' })
    await sync.flush()
    expect((await outbox.list())[0]?.status).toBe('failed')
    ok = true
    await sync.retry('id-1')
    expect(await outbox.list()).toEqual([])
  })

  it('un seul flush à la fois : pas de doublon d\'envoi', async () => {
    let calls = 0
    const { sync } = setup('u1', async () => {
      calls++
      await new Promise((r) => setTimeout(r, 20))
      return { data: 1 }
    })
    await sync.send({ channelId: 'c', content: 'x' })
    await Promise.all([sync.flush(), sync.flush(), sync.flush()])
    expect(calls).toBe(1)
  })

  it('ne flush jamais les messages d\'un autre compte', async () => {
    const shared = memoryStore<OutboxItem>()
    const a = createOutbox({ store: shared, userId: 'a' })
    const b = createOutbox({ store: shared, userId: 'b' })
    await a.add({ id: 'm1', channelId: 'c', content: 'x', parentId: null, sentAt: NOW.toISOString() })
    expect(await b.list()).toEqual([])
    await b.remove('m1')
    expect(await a.list()).toHaveLength(1)
  })

  it('ignore les messages vides', async () => {
    const { sync, outbox } = setup()
    expect(await sync.send({ channelId: 'c', content: '   ' })).toBeNull()
    expect(await outbox.list()).toEqual([])
  })

  it('probe : serveur injoignable = aucun appel', async () => {
    let called = false
    const outbox = createOutbox({ store: memoryStore(), userId: 'u' })
    const sync = createChatSync({
      userId: 'u',
      outbox,
      inbox: createInbox({ store: memoryStore() }),
      probe: async () => false,
      sendToServer: async () => ((called = true), { data: 1 }),
    })
    await sync.send({ channelId: 'c', content: 'x' })
    const r = await sync.flush()
    expect(r.offline).toBe(true)
    expect(called).toBe(false)
  })
})

describe('inbox', () => {
  const env = (id: string, over: Partial<Envelope> = {}): Envelope => ({
    v: 1, id, channelId: 'c', authorId: 'autre', content: 'salut', sentAt: NOW.toISOString(), ...over,
  })

  it('dédoublonne, ignore ses propres messages, confirme', async () => {
    const { sync, inbox } = setup('moi')
    await sync.receive(env('e1'))
    await sync.receive(env('e1'))
    await sync.receive(env('e2', { authorId: 'moi' }))
    expect((await inbox.list()).map((e) => e.id)).toEqual(['e1'])
    await sync.confirm(['e1'])
    expect(await inbox.list()).toEqual([])
  })

  it('rejette les enveloppes malformées', async () => {
    const { sync, inbox } = setup()
    await sync.receive({ ...env('x'), v: 2 } as unknown as Envelope)
    await sync.receive(env('y', { content: '  ' }))
    await sync.receive(env('', {}))
    expect(await inbox.list()).toEqual([])
  })

  it('purge les messages trop vieux', async () => {
    let t = NOW
    const inbox = createInbox({ store: memoryStore(), maxAgeMs: 1000, now: () => t })
    await inbox.put(env('e1'))
    t = new Date(NOW.getTime() + 5000)
    await inbox.purge()
    expect(await inbox.list()).toEqual([])
  })

  it('knownIds : limité aux canaux demandés', async () => {
    const inbox = createInbox({ store: memoryStore() })
    await inbox.put(env('a', { channelId: 'c1' }))
    await inbox.put(env('b', { channelId: 'c2' }))
    expect(await inbox.knownIds(['c1'])).toEqual(['a'])
  })
})

describe('mergeMessages', () => {
  it('serveur > pair > local, trié, sans doublon', () => {
    const t = (m: number) => new Date(NOW.getTime() + m * 1000).toISOString()
    const out = mergeMessages({
      userId: 'moi',
      persisted: [{ id: 'a', channelId: 'c', authorId: 'x', content: 'serveur', parentId: null, createdAt: t(2) }],
      inbox: [
        { v: 1, id: 'a', channelId: 'c', authorId: 'x', content: 'pair', sentAt: t(1) },
        { v: 1, id: 'b', channelId: 'c', authorId: 'y', content: 'pair b', sentAt: t(1) },
      ],
      outbox: [
        { id: 'b', userId: 'moi', channelId: 'c', content: 'local b', parentId: null, sentAt: t(0), status: 'pending' },
        { id: 'c', userId: 'moi', channelId: 'c', content: 'local c', parentId: null, sentAt: t(3), status: 'failed' },
      ],
    })
    expect(out.map((m) => [m.id, m.status, m.content])).toEqual([
      ['b', 'unverified', 'pair b'],
      ['a', 'sent', 'serveur'],
      ['c', 'failed', 'local c'],
    ])
  })
})

describe('pairing', () => {
  const p = { host: '192.168.1.20', port: 8787, token: 'abc', sessionId: 's1' }
  it('aller-retour', () => {
    expect(decodePairing(encodePairing(p))).toEqual({ ...p, url: 'ws://192.168.1.20:8787' })
  })
  it('refuse les hôtes publics et les QR invalides', () => {
    expect(decodePairing(encodePairing({ ...p, host: '8.8.8.8' }))).toBeNull()
    expect(decodePairing(encodePairing({ ...p, host: 'evil.com' }))).toBeNull()
    expect(decodePairing('https://x.com')).toBeNull()
    expect(decodePairing('attendancy://chat?h=10.0.0.1&p=99999&t=a&s=b')).toBeNull()
    expect(decodePairing('pas une url')).toBeNull()
  })
  it('accepte les réseaux privés', () => {
    for (const host of ['10.1.2.3', '172.16.0.1', '172.31.9.9', '192.168.0.5', 'prof.local'])
      expect(decodePairing(encodePairing({ ...p, host }))).not.toBeNull()
    expect(decodePairing(encodePairing({ ...p, host: '172.32.0.1' }))).toBeNull()
  })
})

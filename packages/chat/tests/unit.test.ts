//packages\chat\tests\unit.test.ts
import { describe, expect, it } from 'vitest'
import {
  createChatSync,
  createInbox,
  createOutbox,
  decodePairing,
  encodePairing,
  isTrustedCreatedAt,
  MAX_BACKDATE_MS,
  MAX_CONTENT_LENGTH,
  memoryStore,
  mergeMessages,
  type Envelope,
  type OutboxItem,
  type SendResult,
} from '../src'

const NOW = new Date('2026-10-26T12:00:00.000Z')
const CHANNEL_ID = '11111111-1111-4111-8111-111111111111'
const CHANNEL_ID_2 = '22222222-2222-4222-8222-222222222222'
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

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
    newId: () => uid(++n),
    sendToServer:
      send ??
      (async (i) => {
        calls.push(i.id)
        return { data: i }
      }),
  })
  return { sync, outbox, inbox, outboxStore, calls }
}

describe('limits', () => {
  it('accepte une date passée récente dans la limite', () => {
    const past = new Date(NOW.getTime() - 2 * 86_400_000)
    expect(isTrustedCreatedAt(past, NOW)).toBe(true)
  })

  it('refuse une date future', () => {
    const future = new Date(NOW.getTime() + 60_000)
    expect(isTrustedCreatedAt(future, NOW)).toBe(false)
  })

  it('refuse une date plus vieille que MAX_BACKDATE_MS (7 jours)', () => {
    const tooOld = new Date(NOW.getTime() - MAX_BACKDATE_MS - 1000)
    expect(isTrustedCreatedAt(tooOld, NOW)).toBe(false)
  })

  it('refuse une date invalide (NaN)', () => {
    expect(isTrustedCreatedAt(new Date('invalid'), NOW)).toBe(false)
  })

  it('constantes conformes', () => {
    expect(MAX_BACKDATE_MS).toBe(7 * 86_400_000)
    expect(MAX_CONTENT_LENGTH).toBe(4000)
  })
})

describe('outbox + flush', () => {
  it('envoie dans l\'ordre d\'écriture et vide l\'outbox', async () => {
    const { sync, outbox, calls } = setup()
    await sync.send({ channelId: CHANNEL_ID, content: 'un' })
    await sync.send({ channelId: CHANNEL_ID, content: 'deux' })
    await sync.flush()
    expect(calls).toEqual([uid(1), uid(2)])
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
    await sync.send({ channelId: CHANNEL_ID, content: 'hors ligne' })
    await sync.flush()
    expect((await outbox.list())[0]?.status).toBe('pending')
    online = true
    const r = await sync.flush()
    expect(r.sent).toBe(1)
    expect(sent).toEqual([uid(1)])
    expect(await outbox.list()).toEqual([])
  })

  it('refus serveur : failed, pas de retry auto, retry manuel', async () => {
    let ok = false
    const { sync, outbox } = setup('u1', async () => (ok ? { data: 1 } : { error: 'Accès refusé' }))
    await sync.send({ channelId: CHANNEL_ID, content: 'x' })
    await sync.flush()
    const [item] = await outbox.list()
    expect(item).toMatchObject({ status: 'failed', error: 'Accès refusé' })
    await sync.flush()
    expect((await outbox.list())[0]?.status).toBe('failed')
    ok = true
    await sync.retry(uid(1))
    expect(await outbox.list()).toEqual([])
  })

  it('refus transitoire (retryable) : reste pending puis failed après expiration', async () => {
    let attempts = 0
    let nowTime = NOW
    const outbox = createOutbox({ store: memoryStore(), userId: 'u1' })
    const sync = createChatSync({
      userId: 'u1',
      outbox,
      inbox: createInbox({ store: memoryStore() }),
      now: () => nowTime,
      newId: () => uid(1),
      sendToServer: async () => {
        attempts++
        return { error: 'Parent introuvable', retryable: true }
      },
    })
    await sync.send({ channelId: CHANNEL_ID, content: 'attente parent' })
    const r1 = await sync.flush()
    expect(r1.failed).toBe(0)
    expect((await outbox.list())[0]?.status).toBe('pending')
    expect(attempts).toBeGreaterThanOrEqual(1)

    // Avance le temps au-delà de 7 jours : le prochain flush doit marquer failed
    nowTime = new Date(NOW.getTime() + MAX_BACKDATE_MS + 1000)
    const r2 = await sync.flush()
    expect(r2.failed).toBe(1)
    expect((await outbox.list())[0]?.status).toBe('failed')

    // Retry avec réinitialisation de la date et correction de parent (ex: withoutReply -> parentId: null)
    nowTime = NOW
    await sync.retry(uid(1), { parentId: null })
    const [retried] = await outbox.list()
    expect(retried?.parentId).toBeNull()
    expect(retried?.status).toBe('pending')
  })

  it('onSent : déclenché après succès serveur', async () => {
    let resolveSent!: (item: OutboxItem) => void
    const sentPromise = new Promise<OutboxItem>((resolve) => {
      resolveSent = resolve
    })
    const outbox = createOutbox({ store: memoryStore(), userId: 'u' })
    const sync = createChatSync({
      userId: 'u',
      outbox,
      inbox: createInbox({ store: memoryStore() }),
      sendToServer: async () => ({ data: { confirmed: true } }),
      onSent: (item) => resolveSent(item),
    })
    await sync.send({ channelId: CHANNEL_ID, content: 'notif test' })
    await sync.flush()
    const sentItem = await sentPromise
    expect(sentItem.content).toBe('notif test')
  })

  it('un seul flush à la fois : pas de doublon d\'envoi', async () => {
    let calls = 0
    const { sync } = setup('u1', async () => {
      calls++
      await new Promise((r) => setTimeout(r, 20))
      return { data: 1 }
    })
    await sync.send({ channelId: CHANNEL_ID, content: 'x' })
    await Promise.all([sync.flush(), sync.flush(), sync.flush()])
    expect(calls).toBe(1)
  })

  it('ne flush jamais les messages d\'un autre compte', async () => {
    const shared = memoryStore<OutboxItem>()
    const a = createOutbox({ store: shared, userId: 'a' })
    const b = createOutbox({ store: shared, userId: 'b' })
    await a.add({ id: uid(1), channelId: CHANNEL_ID, content: 'x', parentId: null, createdAt: NOW.toISOString() })
    expect(await b.list()).toEqual([])
    await b.remove(uid(1))
    expect(await a.list()).toHaveLength(1)
  })

  it('attach : attache et détache dynamiquement un transport', async () => {
    const { sync, inbox } = setup('u1')
    let receiveCb: ((e: Envelope) => void) | undefined
    let started = false
    const mockTransport: any = {
      name: 'dynamic',
      start: () => {
        started = true
      },
      stop: () => {
        started = false
      },
      status: () => (started ? 'connected' : 'idle'),
      send: async () => {},
      onReceive: (cb: (e: Envelope) => void) => {
        receiveCb = cb
        return () => {
          receiveCb = undefined
        }
      },
      onStatus: () => () => {},
    }

    sync.start()
    const detach = sync.attach(mockTransport)
    expect(started).toBe(true)

    // Simulation réception
    receiveCb?.({
      v: 1,
      id: uid(50),
      channelId: CHANNEL_ID,
      authorId: 'autre',
      content: 'via dynamique',
      createdAt: NOW.toISOString(),
    })
    await new Promise((r) => setTimeout(r, 20))
    expect((await inbox.list()).map((e) => e.id)).toContain(uid(50))

    detach()
    expect(started).toBe(false)
    sync.stop()
  })

  it('ignore les messages vides', async () => {
    const { sync, outbox } = setup()
    expect(await sync.send({ channelId: CHANNEL_ID, content: '   ' })).toBeNull()
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
    await sync.send({ channelId: CHANNEL_ID, content: 'x' })
    const r = await sync.flush()
    expect(r.offline).toBe(true)
    expect(called).toBe(false)
  })
})

describe('inbox', () => {
  const env = (id: string, over: Partial<Envelope> = {}): Envelope => ({
    v: 1,
    id,
    channelId: CHANNEL_ID,
    authorId: 'autre',
    content: 'salut',
    createdAt: NOW.toISOString(),
    ...over,
  })

  it('dédoublonne, ignore ses propres messages, confirme', async () => {
    const { sync, inbox } = setup('moi')
    await sync.receive(env(uid(1)))
    await sync.receive(env(uid(1)))
    await sync.receive(env(uid(2), { authorId: 'moi' }))
    expect((await inbox.list()).map((e) => e.id)).toEqual([uid(1)])
    await sync.confirm([uid(1)])
    expect(await inbox.list()).toEqual([])
  })

  it('rejette les enveloppes malformées ou non-UUID', async () => {
    const { sync, inbox } = setup()
    await sync.receive({ ...env(uid(1)), v: 2 } as unknown as Envelope)
    await sync.receive(env(uid(2), { content: '  ' }))
    await sync.receive(env('pas-un-uuid', {}))
    await sync.receive(env(uid(3), { channelId: 'non-uuid' }))
    expect(await inbox.list()).toEqual([])
  })

  it('filtre par acceptsChannel', async () => {
    const outbox = createOutbox({ store: memoryStore(), userId: 'u' })
    const inbox = createInbox({ store: memoryStore() })
    const sync = createChatSync({
      userId: 'u',
      outbox,
      inbox,
      sendToServer: async () => ({ data: 1 }),
      acceptsChannel: (cid) => cid === CHANNEL_ID,
    })
    await sync.receive(env(uid(1), { channelId: CHANNEL_ID }))
    await sync.receive(env(uid(2), { channelId: CHANNEL_ID_2 }))
    expect((await inbox.list()).map((e) => e.id)).toEqual([uid(1)])
  })

  it('purge les messages trop vieux', async () => {
    let t = NOW
    const inbox = createInbox({ store: memoryStore(), maxAgeMs: 1000, now: () => t })
    await inbox.put(env(uid(1)))
    t = new Date(NOW.getTime() + 5000)
    await inbox.purge()
    expect(await inbox.list()).toEqual([])
  })

  it('displayed : date du pair si plausible, sinon receivedAt', async () => {
    const inbox = createInbox({ store: memoryStore(), now: () => NOW })
    // Date future = non plausible
    await inbox.put(env(uid(1), { createdAt: '2027-01-01T00:00:00Z' }))
    // Date plausible
    const plausible = new Date(NOW.getTime() - 3600_000).toISOString()
    await inbox.put(env(uid(2), { createdAt: plausible }))

    const list = await inbox.list()
    expect(list.find((e) => e.id === uid(1))?.createdAt).toBe(NOW.toISOString())
    expect(list.find((e) => e.id === uid(2))?.createdAt).toBe(plausible)
  })

  it('knownIds : limité aux canaux demandés', async () => {
    const inbox = createInbox({ store: memoryStore() })
    await inbox.put(env(uid(1), { channelId: CHANNEL_ID }))
    await inbox.put(env(uid(2), { channelId: CHANNEL_ID_2 }))
    expect(await inbox.knownIds([CHANNEL_ID])).toEqual([uid(1)])
  })
})

describe('mergeMessages', () => {
  it('serveur > pair > local, trié, sans doublon', () => {
    const t = (m: number) => new Date(NOW.getTime() + m * 1000).toISOString()
    const out = mergeMessages({
      userId: 'moi',
      persisted: [
        { id: uid(1), channelId: CHANNEL_ID, authorId: 'x', content: 'serveur', parentId: null, createdAt: t(2) },
      ],
      inbox: [
        { v: 1, id: uid(1), channelId: CHANNEL_ID, authorId: 'x', content: 'pair', createdAt: t(1) },
        { v: 1, id: uid(2), channelId: CHANNEL_ID, authorId: 'y', content: 'pair b', createdAt: t(1) },
      ],
      outbox: [
        {
          id: uid(2),
          userId: 'moi',
          channelId: CHANNEL_ID,
          content: 'local b',
          parentId: null,
          createdAt: t(0),
          status: 'pending',
        },
        {
          id: uid(3),
          userId: 'moi',
          channelId: CHANNEL_ID,
          content: 'local c',
          parentId: null,
          createdAt: t(3),
          status: 'failed',
        },
      ],
    })
    expect(out.map((m) => [m.id, m.status, m.content])).toEqual([
      [uid(2), 'unverified', 'pair b'],
      [uid(1), 'sent', 'serveur'],
      [uid(3), 'failed', 'local c'],
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
  it('accepte les réseaux privés et link-local', () => {
    for (const host of ['10.1.2.3', '172.16.0.1', '172.31.9.9', '192.168.0.5', '169.254.1.20', 'prof.local'])
      expect(decodePairing(encodePairing({ ...p, host }))).not.toBeNull()
    expect(decodePairing(encodePairing({ ...p, host: '172.32.0.1' }))).toBeNull()
  })
})

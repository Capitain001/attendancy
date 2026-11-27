//packages\chat\tests\engine.push.test.ts
import { describe, expect, it } from 'vitest'
import { createChatSync, type ChatTransport } from '../src/engine'
import { createInbox } from '../src/inbox'
import { createOutbox } from '../src/outbox'
import { memoryStore } from '../src/store'
import type { Envelope, OutboxItem } from '../src/types'

const C1 = '11111111-1111-4111-8111-111111111111'
const C2 = '22222222-2222-4222-8222-222222222222'
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

function fakeTransport(onSend: (env: Envelope) => Promise<void>) {
  let statusCb: ((s: 'connected') => void) | undefined
  let current: 'idle' | 'connected' = 'idle'
  const sent: string[] = []
  const transport: ChatTransport = {
    name: 'fake',
    start() {},
    stop() {},
    status: () => current,
    async send(env) {
      sent.push(env.id)
      await onSend(env)
    },
    onReceive: () => () => {},
    onStatus(cb) {
      statusCb = cb as (s: 'connected') => void
      return () => {
        statusCb = undefined
      }
    },
  }
  return {
    transport,
    sent,
    connect() {
      current = 'connected'
      statusCb?.('connected')
    },
  }
}

async function seedOutbox(items: Array<{ id: string; channelId: string }>) {
  const outbox = createOutbox({ store: memoryStore<OutboxItem>(), userId: 'u1' })
  let t = 0
  for (const item of items) {
    await outbox.add({
      id: item.id,
      channelId: item.channelId,
      content: `msg ${item.id}`,
      parentId: null,
      createdAt: new Date(1_700_000_000_000 + t++ * 1000).toISOString(),
    })
  }
  return outbox
}

describe('engine : pushTo sur erreurs et filtrage de canal', () => {
  it('continue la file après un refus not_member sur le premier message', async () => {
    const outbox = await seedOutbox([
      { id: uid(1), channelId: C1 },
      { id: uid(2), channelId: C1 },
    ])
    const fake = fakeTransport(async (env) => {
      if (env.id === uid(1)) throw new Error('not_member')
    })
    const sync = createChatSync({
      userId: 'u1',
      outbox,
      inbox: createInbox({ store: memoryStore() }),
      transports: [fake.transport],
      sendToServer: async () => {
        throw new TypeError('offline')
      },
    })
    sync.start()
    fake.connect()
    await new Promise((r) => setTimeout(r, 30))
    expect(fake.sent).toEqual([uid(1), uid(2)])
    sync.stop()
  })

  it('interrompt la file après une erreur de connexion (closed)', async () => {
    const outbox = await seedOutbox([
      { id: uid(1), channelId: C1 },
      { id: uid(2), channelId: C1 },
    ])
    const fake = fakeTransport(async (env) => {
      if (env.id === uid(1)) throw new Error('closed')
    })
    const sync = createChatSync({
      userId: 'u1',
      outbox,
      inbox: createInbox({ store: memoryStore() }),
      transports: [fake.transport],
      sendToServer: async () => {
        throw new TypeError('offline')
      },
    })
    sync.start()
    fake.connect()
    await new Promise((r) => setTimeout(r, 30))
    expect(fake.sent).toEqual([uid(1)])
    sync.stop()
  })

  it('n’envoie jamais au transport un message d’un canal refusé par acceptsChannel', async () => {
    const outbox = await seedOutbox([
      { id: uid(1), channelId: C2 },
      { id: uid(2), channelId: C1 },
    ])
    const fake = fakeTransport(async () => {})
    const sync = createChatSync({
      userId: 'u1',
      outbox,
      inbox: createInbox({ store: memoryStore() }),
      transports: [fake.transport],
      acceptsChannel: (id) => id === C1,
      sendToServer: async () => {
        throw new TypeError('offline')
      },
    })
    sync.start()
    fake.connect()
    await new Promise((r) => setTimeout(r, 30))
    expect(fake.sent).toEqual([uid(2)])
    sync.stop()
  })
})

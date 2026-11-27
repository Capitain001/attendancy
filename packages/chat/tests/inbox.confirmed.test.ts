//packages\chat\tests\inbox.confirmed.test.ts
import { describe, expect, it } from 'vitest'
import { createInbox, type InboxRecord } from '../src/inbox'
import { memoryStore } from '../src/store'
import type { Envelope } from '../src/types'

const env = (id: string): Envelope => ({
  v: 1,
  id,
  channelId: 'c1',
  authorId: 'a',
  content: 'x',
  createdAt: new Date().toISOString(),
})

describe('inbox : historique des confirmés', () => {
  it('un message confirmé n’est plus ré-inséré, mais reste annoncé au relais', async () => {
    const inbox = createInbox({ store: memoryStore<InboxRecord>() })
    await inbox.put(env('m1'))
    await inbox.confirm(['m1'])
    expect(await inbox.list()).toHaveLength(0)
    expect(await inbox.put(env('m1'))).toBe(false)
    expect(await inbox.knownIds(['c1'])).toContain('m1')
  })

  it('un id jamais reçu en local est aussi ignoré après confirmation', async () => {
    const inbox = createInbox({ store: memoryStore<InboxRecord>() })
    await inbox.confirm(['m9'])
    expect(await inbox.put(env('m9'))).toBe(false)
    expect(await inbox.list()).toHaveLength(0)
  })

  it('les traces sont plafonnées : les plus anciennes partent', async () => {
    let t = 0
    const inbox = createInbox({
      store: memoryStore<InboxRecord>(),
      maxConfirmed: 3,
      now: () => new Date(1_700_000_000_000 + t++ * 1000),
    })
    for (const id of ['a', 'b', 'c', 'd', 'e']) await inbox.confirm([id])
    expect(await inbox.has('a')).toBe(false)
    expect(await inbox.has('b')).toBe(false)
    expect(await inbox.has('e')).toBe(true)
  })
})

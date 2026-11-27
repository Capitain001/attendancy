//packages\chat\tests\lan-transport.omitted.test.ts
import WebSocket from 'ws'
import { describe, expect, it } from 'vitest'
import { createLanTransport, type WebSocketCtor } from '../src/lan-transport'
import { fauxRelay, waitFor } from './helpers/faux-relay'

const make = (url: string) =>
  createLanTransport({
    url,
    token: 't',
    userId: 'u',
    channels: ['c1'],
    WebSocketImpl: WebSocket as unknown as WebSocketCtor,
  })

describe('lan-transport : omitted', () => {
  it('expose le nombre de messages omis du welcome, 0 sinon, et le remet à 0 à l’arrêt', async () => {
    const partial = await fauxRelay({ welcome: { omitted: 7 } })
    const t = make(partial.url)
    t.start()
    await waitFor(() => t.status() === 'connected')
    expect(t.omitted?.()).toBe(7)
    t.stop()
    expect(t.omitted?.()).toBe(0)
    await partial.close()

    const full = await fauxRelay()
    const t2 = make(full.url)
    t2.start()
    await waitFor(() => t2.status() === 'connected')
    expect(t2.omitted?.()).toBe(0)
    t2.stop()
    await full.close()
  })
})

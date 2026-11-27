//packages\chat\tests\tauri-websocket.test.ts
import { describe, expect, it } from 'vitest'
import { createTauriWebSocketCtor, type TauriConnection, type TauriMessage } from '../src/tauri-websocket'
import { createFakeTauriPlugin } from './testing/fake-tauri-plugin'
import { webSocketCtorContract } from './testing/websocket-contract'
import { startServer } from './testing/ws-server'

// Même suite que `ws`, contre l'adaptateur posé sur un faux plugin réaliste
webSocketCtorContract('adaptateur Tauri (faux plugin sur ws)', async () => {
  const { server, stop } = await startServer()
  return { Ctor: createTauriWebSocketCtor(createFakeTauriPlugin()), server, stop }
})

// Plugin piloté à la main : pour les cas qu'un vrai serveur ne sait pas provoquer
function manualPlugin() {
  const h = {
    listeners: new Set<(m: TauriMessage) => void>(),
    sent: [] as string[],
    disconnects: 0,
    connectGate: Promise.resolve(),
    connectFails: false,
    sendImpl: async (_message: string) => {},
    emit: (m: TauriMessage) => h.listeners.forEach((cb) => cb(m)),
  }
  const connection: TauriConnection = {
    addListener: (cb) => {
      h.listeners.add(cb)
      return () => void h.listeners.delete(cb)
    },
    send: async (message) => {
      await h.sendImpl(message)
      h.sent.push(message)
    },
    disconnect: async () => void h.disconnects++,
  }
  const plugin = {
    connect: async () => {
      await h.connectGate
      if (h.connectFails) throw 'refusé'
      return connection
    },
  }
  return { h, Ctor: createTauriWebSocketCtor(plugin) }
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 20))

describe('adaptateur Tauri : cas propres au plugin', () => {
  it('ne transmet que les messages Text', async () => {
    const { h, Ctor } = manualPlugin()
    const got: unknown[] = []
    const sock = new Ctor('ws://x')
    sock.onmessage = (ev) => void got.push(ev.data)
    await tick()
    h.emit({ type: 'Binary', data: [1] })
    h.emit({ type: 'Ping', data: [] })
    h.emit({ type: 'Pong', data: [] })
    h.emit({ type: 'Text', data: 'ok' })
    expect(got).toEqual(['ok'])
  })

  it('l\'écouteur est posé avant onopen', async () => {
    const { h, Ctor } = manualPlugin()
    const got: unknown[] = []
    const sock = new Ctor('ws://x')
    sock.onmessage = (ev) => void got.push(ev.data)
    // Un message émis pendant onopen même doit être reçu
    sock.onopen = () => h.emit({ type: 'Text', data: 'dans-onopen' })
    await tick()
    expect(got).toEqual(['dans-onopen'])
  })

  it('deux Close du plugin : un seul onclose, une seule libération', async () => {
    const { h, Ctor } = manualPlugin()
    let closes = 0
    const sock = new Ctor('ws://x')
    sock.onclose = () => void closes++
    await tick()
    h.emit({ type: 'Close', data: null })
    h.emit({ type: 'Close', data: { code: 1006, reason: '' } })
    await tick()
    expect(closes).toBe(1)
    expect(h.disconnects).toBe(1)
  })

  it('un envoi en échec ferme la socket (onclose une fois)', async () => {
    const { h, Ctor } = manualPlugin()
    let closes = 0
    const sock = new Ctor('ws://x')
    sock.onclose = () => void closes++
    await tick()
    h.sendImpl = async () => {
      throw new Error('écriture impossible')
    }
    sock.send('a')
    sock.send('b')
    await tick()
    expect(closes).toBe(1)
    expect(h.sent).toEqual([])
  })

  it('les envois partent dans l\'ordre même si le plugin est lent', async () => {
    const { h, Ctor } = manualPlugin()
    const sock = new Ctor('ws://x')
    await tick()
    let n = 0
    // Les premiers appels sont les plus lents : sans chaînage, l'ordre serait inversé
    h.sendImpl = () => new Promise((resolve) => setTimeout(resolve, 15 - 3 * n++))
    ;['a', 'b', 'c', 'd'].forEach((s) => sock.send(s))
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(h.sent).toEqual(['a', 'b', 'c', 'd'])
  })

  it('close() pendant la connexion : la connexion tardive est refermée, sans onopen', async () => {
    const { h, Ctor } = manualPlugin()
    let release!: () => void
    h.connectGate = new Promise<void>((resolve) => (release = resolve))
    let opens = 0
    let closes = 0
    const sock = new Ctor('ws://x')
    sock.onopen = () => void opens++
    sock.onclose = () => void closes++
    sock.close()
    release()
    await tick()
    expect(opens).toBe(0)
    expect(closes).toBe(1)
    expect(h.disconnects).toBe(1)
  })

  it('connexion refusée : onclose une fois, jamais onopen', async () => {
    const { h, Ctor } = manualPlugin()
    h.connectFails = true
    let opens = 0
    let closes = 0
    const sock = new Ctor('ws://x')
    sock.onopen = () => void opens++
    sock.onclose = () => void closes++
    await tick()
    expect(opens).toBe(0)
    expect(closes).toBe(1)
  })

  it('send avant l\'ouverture lève, comme un vrai WebSocket', () => {
    const { Ctor } = manualPlugin()
    const sock = new Ctor('ws://x')
    expect(() => sock.send('trop tôt')).toThrow()
  })
})

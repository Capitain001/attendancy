//packages\chat\tests\testing\websocket-contract.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { WebSocketCtor } from '../../src/lan-transport'

// Contrat d'un WebSocketCtor tel que lan-transport l'utilise. Elle tourne contre `ws`
// (référence), puis contre l'adaptateur Tauri. Durées en millisecondes.

/** Serveur de test, piloté par la suite. */
export type ContractServer = {
  /** URL joignable */
  url: string
  /** URL où personne n'écoute (échec de connexion) */
  deadUrl: string
  /** Textes reçus des clients, dans l'ordre */
  received: string[]
  sendText(text: string): void
  /** Fermeture propre (trame Close) de toutes les connexions */
  closeClients(): void
  /** Coupure brutale : socket détruite, sans trame Close */
  dropClients(): void
}

export type ContractTarget = {
  Ctor: WebSocketCtor
  server: ContractServer
  stop(): Promise<void>
}

const wait = (delay: number) => new Promise<void>((resolve) => setTimeout(resolve, delay))

async function until(cond: () => boolean, label: string, timeout = 3000) {
  const end = Date.now() + timeout
  while (!cond()) {
    if (Date.now() > end) throw new Error(`délai dépassé : ${label}`)
    await wait(10)
  }
}

// Laisse le temps à un appel en trop de se produire avant de conclure « exactement une fois »
const SETTLE = 150

function track(Ctor: WebSocketCtor, url: string) {
  const log = { opens: 0, closes: 0, messages: [] as unknown[] }
  const sock = new Ctor(url)
  sock.onopen = () => void log.opens++
  sock.onmessage = (ev) => void log.messages.push(ev.data)
  sock.onclose = () => void log.closes++
  sock.onerror = () => {} // comme lan-transport
  return { sock, log }
}

export function webSocketCtorContract(name: string, factory: () => Promise<ContractTarget>) {
  describe(`contrat WebSocketCtor : ${name}`, () => {
    let t: ContractTarget
    beforeEach(async () => {
      t = await factory()
    })
    afterEach(async () => {
      await t.stop()
    })

    it('onopen est appelé une fois', async () => {
      const { log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      await wait(SETTLE)
      expect(log.opens).toBe(1)
      expect(log.closes).toBe(0)
    })

    it('onmessage reçoit data en chaîne', async () => {
      const { log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      t.server.sendText('bonjour')
      await until(() => log.messages.length === 1, 'message')
      expect(log.messages).toEqual(['bonjour'])
      expect(typeof log.messages[0]).toBe('string')
    })

    it('les envois arrivent dans l\'ordre', async () => {
      const { sock, log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      const sent = Array.from({ length: 20 }, (_, i) => `m${i}`)
      sent.forEach((s) => sock.send(s))
      await until(() => t.server.received.length === sent.length, 'réception serveur')
      expect(t.server.received).toEqual(sent)
    })

    it('échec de connexion : onclose une fois, jamais onopen', async () => {
      const { log } = track(t.Ctor, t.server.deadUrl)
      await until(() => log.closes === 1, 'onclose')
      await wait(SETTLE)
      expect(log.closes).toBe(1)
      expect(log.opens).toBe(0)
    })

    it('close() local : onclose une fois, close() idempotent', async () => {
      const { sock, log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      sock.close()
      await until(() => log.closes === 1, 'onclose')
      expect(() => sock.close()).not.toThrow()
      await wait(SETTLE)
      expect(log.closes).toBe(1)
    })

    it('close() pendant la connexion : aucun onopen, un seul onclose', async () => {
      const { sock, log } = track(t.Ctor, t.server.url)
      sock.close()
      await until(() => log.closes === 1, 'onclose')
      await wait(SETTLE)
      expect(log.closes).toBe(1)
      expect(log.opens).toBe(0)
    })

    it('fermeture propre côté serveur : onclose une fois', async () => {
      const { log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      t.server.closeClients()
      await until(() => log.closes === 1, 'onclose')
      await wait(SETTLE)
      expect(log.closes).toBe(1)
    })

    it('coupure brutale sans trame Close : onclose une fois', async () => {
      const { log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      t.server.dropClients()
      await until(() => log.closes === 1, 'onclose')
      await wait(SETTLE)
      expect(log.closes).toBe(1)
    })

    it('send après fermeture ne lève pas et n\'envoie rien', async () => {
      const { sock, log } = track(t.Ctor, t.server.url)
      await until(() => log.opens === 1, 'onopen')
      sock.close()
      await until(() => log.closes === 1, 'onclose')
      expect(() => sock.send('tard')).not.toThrow()
      await wait(SETTLE)
      expect(t.server.received).not.toContain('tard')
    })
  })
}

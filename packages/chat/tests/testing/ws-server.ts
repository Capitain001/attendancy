//packages\chat\tests\testing\ws-server.ts
import { createServer, type AddressInfo } from 'node:net'
import { WebSocket as WsClient, WebSocketServer } from 'ws'
import type { WebSocketCtor } from '../../src/lan-transport'
import type { ContractServer, ContractTarget } from './websocket-contract'

// Un port qui vient d'être libéré : personne n'y écoute (échec de connexion)
async function freePort(): Promise<number> {
  const probe = createServer()
  await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve))
  const { port } = probe.address() as AddressInfo
  await new Promise<void>((resolve) => probe.close(() => resolve()))
  return port
}

export async function startServer(): Promise<{ server: ContractServer; stop(): Promise<void> }> {
  const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 })
  await new Promise<void>((resolve) => wss.once('listening', () => resolve()))
  const { port } = wss.address() as AddressInfo
  const deadPort = await freePort()

  const received: string[] = []
  wss.on('connection', (client) => {
    client.on('message', (data) => received.push(data.toString()))
    client.on('error', () => {})
  })

  const server: ContractServer = {
    url: `ws://127.0.0.1:${port}`,
    deadUrl: `ws://127.0.0.1:${deadPort}`,
    received,
    sendText: (text) => wss.clients.forEach((c) => c.send(text)),
    closeClients: () => wss.clients.forEach((c) => c.close(1000)),
    dropClients: () => wss.clients.forEach((c) => c.terminate()),
  }
  return {
    server,
    stop: async () => {
      wss.clients.forEach((c) => c.terminate())
      await new Promise<void>((resolve) => wss.close(() => resolve()))
    },
  }
}

/** Référence : le client `ws` lui-même. */
export async function wsTarget(): Promise<ContractTarget> {
  const { server, stop } = await startServer()
  return { Ctor: WsClient as unknown as WebSocketCtor, server, stop }
}

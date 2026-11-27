//packages\chat\tests\testing\fake-tauri-plugin.ts
import { WebSocket as WsClient } from 'ws'
import type { TauriConnection, TauriMessage, TauriWebSocketPlugin } from '../../src/tauri-websocket'

// Faux plugin au-dessus de `ws`, qui imite le vrai : connect() asynchrone, pas d'événement open,
// panne du flux ET fermeture signalées toutes deux par un message `Close` (donc parfois
// deux fois : l'adaptateur doit n'en tirer qu'un onclose).
export function createFakeTauriPlugin(): TauriWebSocketPlugin {
  return {
    connect: (url) =>
      new Promise<TauriConnection>((resolve, reject) => {
        const ws = new WsClient(url)
        const listeners = new Set<(m: TauriMessage) => void>()
        const emit = (m: TauriMessage) => listeners.forEach((cb) => cb(m))
        let opened = false

        const connection: TauriConnection = {
          addListener(cb) {
            listeners.add(cb)
            return () => void listeners.delete(cb)
          },
          send: (message) =>
            new Promise<void>((res, rej) => ws.send(message, (e) => (e ? rej(e) : res()))),
          disconnect: () =>
            new Promise<void>((res) => {
              if (ws.readyState === WsClient.CLOSED) return res()
              ws.once('close', () => res())
              ws.close(1000)
            }),
        }

        ws.on('open', () => {
          opened = true
          resolve(connection)
        })
        ws.on('message', (data, isBinary) =>
          emit(
            isBinary
              ? { type: 'Binary', data: [...(data as Buffer)] }
              : { type: 'Text', data: data.toString() },
          ),
        )
        ws.on('error', (e) => (opened ? emit({ type: 'Close', data: null }) : reject(String(e))))
        ws.on('close', (code, reason) =>
          opened ? emit({ type: 'Close', data: { code, reason: reason.toString() } }) : reject('closed'),
        )
      }),
  }
}

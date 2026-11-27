//packages\chat\src\tauri-websocket.ts
import type { WebSocketCtor } from './lan-transport'

// Expose le plugin Tauri (@tauri-apps/plugin-websocket) sous la forme du `WebSocketCtor` que
// `createLanTransport` attend. Le plugin est INJECTÉ : ce paquet ne dépend pas de Tauri,
// et les tests passent un faux.
//
// Différences à absorber (d'après le .d.ts du plugin) :
// - connect() est asynchrone et il n'y a ni événement open ni error : onopen = connect() résolu ;
// - une panne du flux arrive comme un message `Close` dans le listener ;
// - send() et disconnect() sont asynchrones, ceux d'un WebSocket sont synchrones.
//
// Garanties : `onclose` est appelé exactement UNE fois, quelle qu'en soit la cause (échec de
// connexion, Close du pair, close() local, envoi en échec), jamais de façon synchrone.
// `onopen` n'est jamais appelé après un close().

type Socket = InstanceType<WebSocketCtor>

/** Sous-ensemble du message du plugin : seuls `Text` et `Close` nous intéressent. */
export type TauriMessage = { type: string; data: unknown }

/** Sous-ensemble d'une connexion du plugin (la classe `WebSocket` du plugin y satisfait). */
export interface TauriConnection {
  addListener(cb: (message: TauriMessage) => void): () => void
  send(message: string): Promise<void>
  disconnect(): Promise<void>
}

/** Ce qu'on attend du plugin : sa classe `WebSocket` convient telle quelle (méthode statique connect). */
export interface TauriWebSocketPlugin {
  connect(url: string): Promise<TauriConnection>
}

export function createTauriWebSocketCtor(plugin: TauriWebSocketPlugin): WebSocketCtor {
  return class TauriWebSocket implements Socket {
    onopen: Socket['onopen'] = null
    onmessage: Socket['onmessage'] = null
    onclose: Socket['onclose'] = null
    // Jamais appelé : le plugin ne signale aucune erreur à part. La propriété doit exister
    // car lan-transport l'assigne.
    onerror: Socket['onerror'] = null

    private connection: TauriConnection | null = null
    private stopListening: (() => void) | null = null
    private finished = false
    // Envois chaînés : l'ordre d'émission est celui des appels, même si le plugin est asynchrone
    private sending: Promise<void> = Promise.resolve()

    constructor(url: string) {
      void this.connect(url)
    }

    private async connect(url: string) {
      let connection: TauriConnection
      try {
        connection = await plugin.connect(url)
      } catch {
        this.finish() // échec de connexion : un onclose, jamais d'onopen
        return
      }
      if (this.finished) {
        // close() demandé pendant la connexion : on referme celle qui vient de s'ouvrir
        void connection.disconnect().catch(() => {})
        return
      }
      this.connection = connection
      // Écouteur posé AVANT onopen, dans le même tour : le plugin ne rejoue pas les messages
      // arrivés alors que personne n'écoutait.
      this.stopListening = connection.addListener((m) => this.receive(m))
      this.onopen?.({})
    }

    private receive(m: TauriMessage) {
      if (this.finished) return
      if (m.type === 'Text' && typeof m.data === 'string') {
        this.onmessage?.({ data: m.data })
      } else if (m.type === 'Close') {
        this.finish()
      }
      // Binary, Ping, Pong : sans usage dans le protocole, ignorés
    }

    send(data: string) {
      if (this.finished) return // comme un vrai WebSocket : l'envoi après fermeture est ignoré
      const connection = this.connection
      if (!connection) throw new Error('not_open') // comme InvalidStateError pendant la connexion
      this.sending = this.sending
        .then(() => (this.finished ? undefined : connection.send(data)))
        .catch(() => this.finish()) // un envoi en échec = connexion perdue
    }

    close() {
      this.finish()
    }

    // Point unique de fermeture : idempotent, d'où le onclose unique
    private finish() {
      if (this.finished) return
      this.finished = true
      this.stopListening?.()
      this.stopListening = null
      const connection = this.connection
      this.connection = null
      // Libère la connexion côté Rust, même quand c'est le pair qui a fermé
      if (connection) void connection.disconnect().catch(() => {})
      // Jamais synchrone : comme un vrai WebSocket, et comme l'attend lan-transport
      queueMicrotask(() => this.onclose?.({}))
    }
  }
}

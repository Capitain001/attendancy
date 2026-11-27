//packages\chat\src\local-host-transport.ts
import type { ChatTransport, TransportStatus } from './engine'
import type { Envelope } from './types'

// Transport de l'utilisateur qui HÉBERGE le relais (même processus) : ses messages passent par
// le pont natif (post_as_host) au lieu d'une socket, et il reçoit ce que disent les autres.
// Le pont est une petite interface : Tauri l'implémente en livraison 3, un faux dans les tests.

export interface HostBridge {
  /** Publie un message de l'hôte. true = nouveau, false = déjà connu. Rejette avec la raison du refus. */
  post(env: Envelope): Promise<boolean>
  /** Messages acceptés depuis le réseau (jamais ceux de l'hôte). */
  onMessage(cb: (env: Envelope) => void): () => void
  /** Tout ce que le relais garde. */
  snapshot(): Promise<Envelope[]>
  /** Le récepteur a pris du retard (Lagged) : des messages ont été perdus, relire l'instantané. */
  onResync(cb: () => void): () => void
}

export type LocalHostOptions = {
  /** Identité de l'hôte : ses propres messages ne lui sont pas renvoyés. */
  hostUserId: string
}

// Raison d'un rejet du pont : Error('not_member'), { code: 'not_member' } (erreur Tauri
// sérialisée) ou simple chaîne. Chaîne vide si inconnue : le moteur s'arrête alors par prudence.
function reasonOf(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'code' in e) return String((e as { code: unknown }).code)
  return ''
}

export function createLocalHostTransport(bridge: HostBridge, opts: LocalHostOptions): ChatTransport {
  let state: TransportStatus = 'idle'
  let stopped = true
  let failure: string | null = null
  // Chaque start() ouvre une génération : un instantané en vol après stop() ne livre rien
  let generation = 0
  let syncing = false
  let resyncQueued = false
  const offs: (() => void)[] = []

  const recvCbs = new Set<(e: Envelope) => void>()
  const statusCbs = new Set<(s: TransportStatus) => void>()

  const setState = (s: TransportStatus) => {
    if (state === s) return
    state = s
    statusCbs.forEach((cb) => cb(s))
  }

  // Les messages de l'hôte sont les siens : inutile de les lui renvoyer
  const deliver = (env: Envelope) => {
    if (env.authorId === opts.hostUserId) return
    recvCbs.forEach((cb) => cb(env))
  }

  // Relit tout ce que garde le relais ; les doublons sont écartés par l'inbox
  async function catchUp(gen: number) {
    const all = await bridge.snapshot()
    if (gen !== generation) return
    all.forEach(deliver)
  }

  // Plusieurs `Lagged` d'affilée : une seule relecture en cours, une de plus au plus
  async function resync(gen: number) {
    if (syncing) {
      resyncQueued = true
      return
    }
    syncing = true
    try {
      do {
        resyncQueued = false
        await catchUp(gen).catch(() => {}) // le prochain Lagged réessaiera
      } while (resyncQueued && gen === generation)
    } finally {
      syncing = false
    }
  }

  return {
    name: 'local',
    status: () => state,
    failure: () => failure,
    omitted: () => 0, // l'hôte lit l'instantané complet : jamais d'historique omis
    start() {
      if (!stopped) return
      stopped = false
      failure = null
      generation++
      const gen = generation
      setState('connecting')

      // Abonnement AVANT la lecture de l'instantané : un message arrivé entre les deux
      // serait sinon perdu.
      offs.push(bridge.onMessage(deliver), bridge.onResync(() => void resync(gen)))

      // L'instantané est livré AVANT « connected » (comme le backlog d'un welcome) : le moteur
      // renvoie l'outbox à ce statut, après avoir reçu l'historique.
      void catchUp(gen)
        .then(() => {
          if (gen === generation) setState('connected')
        })
        .catch((e) => {
          if (gen !== generation) return
          failure = reasonOf(e) || 'snapshot_failed'
          stopped = true
          offs.splice(0).forEach((off) => off())
          setState('closed')
        })
    },
    stop() {
      stopped = true
      generation++
      syncing = false
      resyncQueued = false
      offs.splice(0).forEach((off) => off())
      setState('closed')
    },
    async send(env) {
      if (state !== 'connected') throw new Error('not_connected')
      try {
        await bridge.post(env) // true ou false (doublon) : dans les deux cas le message est connu
      } catch (e) {
        const reason = reasonOf(e)
        // Relais arrêté : c'est la connexion qui est perdue, pas ce message
        if (reason === 'NotRunning') {
          setState('closed')
          throw new Error('closed')
        }
        // Autre refus (not_member, bad_content, channel_limit...) : ne concerne que CE message,
        // le moteur passe au suivant
        throw new Error(reason)
      }
    },
    onReceive(cb) {
      recvCbs.add(cb)
      return () => void recvCbs.delete(cb)
    },
    onStatus(cb) {
      statusCbs.add(cb)
      return () => void statusCbs.delete(cb)
    },
  }
}

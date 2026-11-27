//packages\chat\src\inbox.ts
import type { KVStore } from './store'
import type { Envelope } from './types'
import { isTrustedCreatedAt, MAX_BACKDATE_MS } from './limits'
import { byCreatedAt } from './outbox'

export type InboxEntry = { env: Envelope; receivedAt: string }
// Trace d'un message confirmé par le serveur : l'id reste connu (annoncé au relais, ignoré par put)
// sans garder le contenu. Bornée par MAX_CONFIRMED.
export type ConfirmedMark = { confirmedAt: string }
export type InboxRecord = InboxEntry | ConfirmedMark

export const MAX_CONFIRMED = 500

export type Inbox = ReturnType<typeof createInbox>

const isEntry = (r: InboxRecord): r is InboxEntry => 'env' in r

// Date du pair si plausible AU MOMENT DE LA RÉCEPTION, sinon la date de réception.
// Évaluée contre receivedAt (et non « maintenant ») pour rester stable dans le temps.
// L'enveloppe stockée n'est jamais modifiée : la future signature porte sur l'original.
const displayed = ({ env, receivedAt }: InboxEntry): Envelope =>
  isTrustedCreatedAt(new Date(env.createdAt), new Date(receivedAt))
    ? env
    : { ...env, createdAt: receivedAt }

// Messages reçus d'un pair (hub LAN, BLE) : NON VÉRIFIÉS tant que la version
// du serveur n'est pas arrivée. confirm() les remplace par une trace (id seul) : le relais ne les
// renvoie plus (knownIds) et put() les ignore, même après rechargement.
export function createInbox({
  store,
  maxAgeMs = MAX_BACKDATE_MS,
  maxConfirmed = MAX_CONFIRMED,
  now = () => new Date(),
}: {
  store: KVStore<InboxRecord>
  maxAgeMs?: number
  maxConfirmed?: number
  now?: () => Date
}) {
  async function put(env: Envelope) {
    if (await store.get(env.id)) return false // déjà reçu, ou déjà confirmé
    await store.set(env.id, { env, receivedAt: now().toISOString() })
    return true
  }

  async function list(channelId?: string) {
    return (await store.entries())
      .flatMap(([, v]) => (isEntry(v) ? [displayed(v)] : []))
      .filter((e) => !channelId || e.channelId === channelId)
      .sort(byCreatedAt)
  }

  async function marks() {
    return (await store.entries())
      .flatMap(([id, v]) => (isEntry(v) ? [] : [{ id, at: Date.parse(v.confirmedAt) }]))
      .sort((a, b) => a.at - b.at)
  }

  async function trimConfirmed() {
    const all = await marks()
    for (const m of all.slice(0, Math.max(0, all.length - maxConfirmed))) await store.del(m.id)
  }

  async function confirm(ids: string[]) {
    const mark: ConfirmedMark = { confirmedAt: now().toISOString() }
    const recent = new Set(ids.slice(-maxConfirmed)) // au-delà du plafond, inutile de marquer
    for (const id of ids) {
      const cur = await store.get(id)
      if (cur && isEntry(cur)) await store.set(id, mark)
      else if (!cur && recent.has(id)) await store.set(id, mark)
    }
    await trimConfirmed()
  }

  async function purge() {
    const limit = now().getTime() - maxAgeMs
    for (const [id, v] of await store.entries()) {
      const at = isEntry(v) ? v.receivedAt : v.confirmedAt
      if (Date.parse(at) < limit) await store.del(id)
    }
    await trimConfirmed()
  }

  // Ids à annoncer au hub pour qu'il n'envoie pas ce qu'on a déjà : messages non confirmés
  // d'abord, puis les confirmés (en dernier : le transport garde la fin de la liste).
  async function knownIds(channelIds: string[], limit = 200) {
    const own = (await list()).filter((e) => channelIds.includes(e.channelId)).slice(-limit).map((e) => e.id)
    const confirmed = (await marks()).slice(-limit).map((m) => m.id)
    return [...own, ...confirmed]
  }

  return { put, list, confirm, purge, knownIds, has: async (id: string) => !!(await store.get(id)) }
}

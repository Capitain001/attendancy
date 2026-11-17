import type { KVStore } from './store'
import type { Envelope } from './types'
import { bySentAt } from './outbox'

export type InboxEntry = { env: Envelope; receivedAt: string }

export type Inbox = ReturnType<typeof createInbox>

// Messages reçus d'un pair (hub LAN, BLE) : NON VÉRIFIÉS tant que la version
// du serveur n'est pas arrivée. Ils sont retirés par confirm() ou purgés.
export function createInbox({
  store,
  maxAgeMs = 7 * 86_400_000,
  now = () => new Date(),
}: {
  store: KVStore<InboxEntry>
  maxAgeMs?: number
  now?: () => Date
}) {
  async function put(env: Envelope) {
    if (await store.get(env.id)) return false
    await store.set(env.id, { env, receivedAt: now().toISOString() })
    return true
  }

  async function list(channelId?: string) {
    return (await store.entries())
      .map(([, v]) => v.env)
      .filter((e) => !channelId || e.channelId === channelId)
      .sort(bySentAt)
  }

  async function confirm(ids: string[]) {
    for (const id of ids) await store.del(id)
  }

  async function purge() {
    const limit = now().getTime() - maxAgeMs
    for (const [id, v] of await store.entries()) {
      if (Date.parse(v.receivedAt) < limit) await store.del(id)
    }
  }

  // Ids à annoncer au hub pour qu'il n'envoie pas ce qu'on a déjà.
  async function knownIds(channelIds: string[], limit = 200) {
    const all = (await list()).filter((e) => channelIds.includes(e.channelId))
    return all.slice(-limit).map((e) => e.id)
  }

  return { put, list, confirm, purge, knownIds, has: async (id: string) => !!(await store.get(id)) }
}

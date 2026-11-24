// src/hooks/data/chat/reconcile.ts
import type { GetMessagesDto } from '@attendancy/types'
import { MESSAGES_PAGE_SIZE } from '@/services/message/constants'

type Dto = GetMessagesDto[number]

// new Date() : tolère un createdAt string laissé dans le cache par une mise à jour optimiste
const time = (m: Dto) => new Date(m.createdAt).getTime()

// Même ordre que la requête serveur : (createdAt, id)
export const compareMessages = (a: Dto, b: Dto) =>
  time(a) - time(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

// Minimum par (createdAt, id) : le cache n'est pas garanti trié, items[0] ne suffit pas.
export const findOldestMessage = (items: Dto[]) =>
  items.reduce<Dto | undefined>(
    (oldest, m) => (!oldest || compareMessages(m, oldest) < 0 ? m : oldest),
    undefined,
  )

/**
 * Réconcilie le cache avec la fenêtre fraîche (les plus récents) d'un refetch.
 * Dans la fenêtre : le serveur fait foi (éditions, suppressions d'autres utilisateurs).
 * En dessous : l'historique déjà remonté est conservé, sans trou.
 */
export function reconcileMessages(existing: Dto[], fresh: Dto[]): Dto[] {
  // Fenêtre non pleine : elle contient tout le canal, le serveur fait foi.
  if (fresh.length < MESSAGES_PAGE_SIZE) return fresh

  // Aucun message en commun : des messages ont pu arriver entre les deux (longue absence).
  // Fusionner laisserait un trou : on repart de la fenêtre fraîche, l'historique se rechargera.
  const freshIds = new Set(fresh.map((m) => m.id))
  if (!existing.some((m) => freshIds.has(m.id))) return fresh

  const oldestFresh = findOldestMessage(fresh)
  if (!oldestFresh) return fresh
  return [
    ...existing.filter((m) => compareMessages(m, oldestFresh) < 0).sort(compareMessages),
    ...fresh,
  ]
}
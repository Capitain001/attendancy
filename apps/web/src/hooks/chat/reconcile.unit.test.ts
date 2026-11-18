import { describe, expect, it } from 'vitest'
import type { GetMessagesDto } from '@/services/message'
import { MESSAGES_PAGE_SIZE } from '@/services/message/constants'
import { compareMessages, findOldestMessage, reconcileMessages } from './reconcile'

type Dto = GetMessagesDto[number]

function createMsg(id: string, dateIso: string, content = `msg-${id}`): Dto {
  return {
    id,
    content,
    createdAt: new Date(dateIso),
    updatedAt: new Date(dateIso),
    editedAt: new Date(dateIso),
    channelId: 'channel-1',
    parentId: null,
    parent: null,
    user: { id: 'u1', firstName: 'Alice', lastName: null, avatar_url: null },
  }
}

describe('reconcile.ts', () => {
  describe('compareMessages & findOldestMessage', () => {
    it('trie chronologiquement par createdAt croissant', () => {
      const m1 = createMsg('1', '2026-11-18T10:00:00.000Z')
      const m2 = createMsg('2', '2026-11-18T10:05:00.000Z')
      expect(compareMessages(m1, m2)).toBeLessThan(0)
      expect(compareMessages(m2, m1)).toBeGreaterThan(0)
    })

    it('départage par id croissant en cas de timestamps identiques', () => {
      const mA = createMsg('a', '2026-11-18T10:00:00.000Z')
      const mB = createMsg('b', '2026-11-18T10:00:00.000Z')
      expect(compareMessages(mA, mB)).toBeLessThan(0)
      expect(compareMessages(mB, mA)).toBeGreaterThan(0)
    })

    it('trouve le message le plus ancien même dans une liste non ordonnée', () => {
      const m1 = createMsg('1', '2026-11-18T10:00:00.000Z')
      const m2 = createMsg('2', '2026-11-18T10:05:00.000Z')
      const m0 = createMsg('0', '2026-11-18T09:55:00.000Z')
      expect(findOldestMessage([m2, m0, m1])).toEqual(m0)
    })

    it('tolère un createdAt au format string (mise à jour optimiste / JSON)', () => {
      const mDate = createMsg('1', '2026-11-18T10:00:00.000Z')
      const mString = {
        ...createMsg('2', '2026-11-18T10:05:00.000Z'),
        createdAt: '2026-11-18T10:05:00.000Z' as unknown as Date,
      }
      expect(compareMessages(mDate, mString)).toBeLessThan(0)
    })
  })

  describe('reconcileMessages', () => {
    it('Cas 1 : Fenêtre non pleine (< MESSAGES_PAGE_SIZE) -> le serveur fait foi absolue', () => {
      // 3 messages seulement dans le canal
      const fresh = [
        createMsg('1', '2026-11-18T10:00:00.000Z'),
        createMsg('2', '2026-11-18T10:01:00.000Z'),
        createMsg('3', '2026-11-18T10:02:00.000Z'),
      ]
      // Le cache contenait un message fantôme 'old-deleted'
      const existing = [
        createMsg('old-deleted', '2026-11-18T09:59:00.000Z'),
        createMsg('1', '2026-11-18T10:00:00.000Z'),
      ]

      const result = reconcileMessages(existing, fresh)
      // Comme fresh.length (3) < 50, fresh est la vérité intégrale du canal
      expect(result).toBe(fresh)
      expect(result.map((m) => m.id)).toEqual(['1', '2', '3'])
    })

    it('Cas 2 : Sans chevauchement (rupture temporelle / coupure > 50 msgs) -> reset à fresh pour éviter le trou', () => {
      // existing contient de vieux messages (ex: 1 à 10)
      const existing = Array.from({ length: 10 }, (_, i) =>
        createMsg(`old-${i}`, new Date(Date.UTC(2026, 10, 18, 8, i)).toISOString()),
      )

      // fresh contient 50 messages récents (100 à 149), aucun ID en commun
      const fresh = Array.from({ length: MESSAGES_PAGE_SIZE }, (_, i) =>
        createMsg(`fresh-${i}`, new Date(Date.UTC(2026, 10, 18, 12, i)).toISOString()),
      )

      const result = reconcileMessages(existing, fresh)
      // Aucun ID commun : fusionner créerait un trou irrécupérable entre 08h10 et 12h00
      expect(result).toBe(fresh)
      expect(result.length).toBe(MESSAGES_PAGE_SIZE)
      expect(result[0].id).toBe('fresh-0')
    })

    it('Cas 3 : Avec chevauchement -> conserve l’historique antérieur et laisse le serveur faire foi dans sa fenêtre', () => {
      // Historique antérieur scrollé vers le passé : messages 0 à 19
      const olderHistory = Array.from({ length: 20 }, (_, i) =>
        createMsg(`msg-${i}`, new Date(Date.UTC(2026, 10, 18, 9, i)).toISOString()),
      )

      // Fenêtre précédente en cache : messages 20 à 69 (50 messages)
      const cachedWindow = Array.from({ length: 50 }, (_, i) =>
        createMsg(`msg-${i + 20}`, new Date(Date.UTC(2026, 10, 18, 10, i)).toISOString()),
      )

      const existing = [...olderHistory, ...cachedWindow] // 70 messages au total

      // 10 nouveaux messages sont arrivés sur le serveur pendant l'intervalle :
      // fresh contient maintenant les messages 30 à 79 (50 messages)
      // Note : msg-20 à msg-29 sont sortis de la page de 50 du serveur,
      // mais msg-30 à msg-69 sont en commun (chevauchement garanti) !
      const fresh = Array.from({ length: 50 }, (_, i) =>
        createMsg(
          `msg-${i + 30}`,
          new Date(Date.UTC(2026, 10, 18, 10, i + 10)).toISOString(),
          // msg-35 a été édité sur le serveur
          i + 30 === 35 ? 'Contenu édité sur le serveur' : undefined,
        ),
      )

      const result = reconcileMessages(existing, fresh)

      // 1. Tous les messages antérieurs à oldestFresh (msg-30) sont conservés (msg-0 à msg-29)
      expect(result.some((m) => m.id === 'msg-0')).toBe(true)
      expect(result.some((m) => m.id === 'msg-20')).toBe(true)
      expect(result.some((m) => m.id === 'msg-29')).toBe(true)

      // 2. Le message édité porte bien le contenu serveur frais
      const edited = result.find((m) => m.id === 'msg-35')
      expect(edited?.content).toBe('Contenu édité sur le serveur')

      // 3. Les nouveaux messages (msg-70 à msg-79) sont bien intégrés
      expect(result.some((m) => m.id === 'msg-79')).toBe(true)

      // 4. L'ordre chronologique est préservé de bout en bout
      const ids = result.map((m) => m.id)
      const expectedIds = Array.from({ length: 80 }, (_, i) => `msg-${i}`)
      expect(ids).toEqual(expectedIds)
    })

    it('Cas 3 bis : Suppressions par des tiers dans la fenêtre fraîche -> éjectées du cache', () => {
      // 50 messages en cache (msg-0 à msg-49)
      const existing = Array.from({ length: 50 }, (_, i) =>
        createMsg(`msg-${i}`, new Date(Date.UTC(2026, 10, 18, 10, i)).toISOString()),
      )

      // Sur le serveur, msg-40 a été supprimé par un pair (where: { deletedAt: null })
      // Un nouveau message msg-51 est arrivé, maintenant fresh va de msg-1 à msg-51 (50 messages) SANS msg-40
      const fresh = Array.from({ length: 52 }, (_, i) =>
        createMsg(`msg-${i}`, new Date(Date.UTC(2026, 10, 18, 10, i)).toISOString()),
      )
        .filter((m) => m.id !== 'msg-0' && m.id !== 'msg-40') // msg-0 est sorti de la page, msg-40 supprimé
        .slice(0, 50)

      expect(fresh.length).toBe(MESSAGES_PAGE_SIZE)
      expect(fresh.some((m) => m.id === 'msg-40')).toBe(false)

      const result = reconcileMessages(existing, fresh)

      // msg-0 est antérieur à oldestFresh (msg-1) -> conservé car hors fenêtre
      expect(result.some((m) => m.id === 'msg-0')).toBe(true)
      // msg-40 était dans la fenêtre [msg-1, msg-50] mais absent de fresh -> ÉJECTÉ
      expect(result.some((m) => m.id === 'msg-40')).toBe(false)
    })
  })
})

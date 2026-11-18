import { describe, expect, it } from 'vitest'
import { truncatePreview } from '@/services/message/preview'
import { mapReplySnapshots, resolveReplyTo } from './utils'
import type { RealtimeMessage } from './use-realtime-chat'
import type { ReplyPreview } from './types'
import type { GetMessagesDto } from '@/services/message'

describe('reply-to resolution & truncatePreview', () => {
  describe('truncatePreview', () => {
    it('laisse intact un texte plus court que la limite', () => {
      expect(truncatePreview('Bonjour !')).toBe('Bonjour !')
    })

    it('tronque à la limite et ajoute un ellipse (…) sans couper en deux', () => {
      const longText = 'a'.repeat(250)
      const truncated = truncatePreview(longText, 200)
      expect(truncated.length).toBe(201) // 200 'a' + '…'
      expect(truncated.endsWith('…')).toBe(true)
    })

    it('gère correctement les emojis sans corrompre les caractères multi-octets', () => {
      const emojis = '🎉'.repeat(25)
      const truncated = truncatePreview(emojis, 10)
      expect(Array.from(truncated).length).toBe(11) // 10 emojis + '…'
      expect(truncated.endsWith('…')).toBe(true)
    })
  })

  describe('mapReplySnapshots', () => {
    it('extrait les instantanés du parent et déduplique par parent.id', () => {
      const messages: GetMessagesDto = [
        {
          id: 'msg-1',
          content: 'Réponse 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          editedAt: null,
          channelId: 'chan-1',
          parentId: 'parent-1',
          parent: {
            id: 'parent-1',
            deleted: false,
            content: 'Message d origine',
            user: { id: 'u-1', firstName: 'Alice', lastName: 'Dupont' },
          },
          user: { id: 'u-2', firstName: 'Bob', lastName: null, avatar_url: null },
        },
        {
          id: 'msg-2',
          content: 'Réponse 2',
          createdAt: new Date(),
          updatedAt: new Date(),
          editedAt: null,
          channelId: 'chan-1',
          parentId: 'parent-1',
          parent: {
            id: 'parent-1',
            deleted: false,
            content: 'Message d origine',
            user: { id: 'u-1', firstName: 'Alice', lastName: 'Dupont' },
          },
          user: { id: 'u-3', firstName: 'Charlie', lastName: null, avatar_url: null },
        },
        {
          id: 'msg-3',
          content: 'Message racine',
          createdAt: new Date(),
          updatedAt: new Date(),
          editedAt: null,
          channelId: 'chan-1',
          parentId: null,
          parent: null,
          user: { id: 'u-1', firstName: 'Alice', lastName: null, avatar_url: null },
        },
      ]

      const snapshots = mapReplySnapshots(messages)
      expect(snapshots.size).toBe(1)
      expect(snapshots.get('parent-1')).toEqual({
        id: 'parent-1',
        authorName: 'Alice Dupont',
        content: 'Message d origine',
        state: 'available',
      })
    })

    it('gère un parent supprimé dans le DTO', () => {
      const messages: GetMessagesDto = [
        {
          id: 'msg-1',
          content: 'Réponse',
          createdAt: new Date(),
          updatedAt: new Date(),
          editedAt: null,
          channelId: 'chan-1',
          parentId: 'parent-del',
          parent: {
            id: 'parent-del',
            deleted: true,
            content: null,
            user: { id: 'u-1', firstName: 'Alice', lastName: null },
          },
          user: { id: 'u-2', firstName: 'Bob', lastName: null, avatar_url: null },
        },
      ]

      const snapshots = mapReplySnapshots(messages)
      expect(snapshots.get('parent-del')).toEqual({
        id: 'parent-del',
        authorName: 'Alice',
        content: null,
        state: 'deleted',
      })
    })
  })

  describe('resolveReplyTo', () => {
    const parentMsg: RealtimeMessage = {
      id: 'p-1',
      content: 'Texte d origine',
      parentId: null,
      createdAt: '2026-11-18T10:00:00.000Z',
      editedAt: null,
      user: { id: 'u-1', name: 'Alice' },
    }

    it('renvoie null si parentId est falsy', () => {
      const loaded = new Map<string, RealtimeMessage>()
      const snapshots = new Map<string, ReplyPreview>()
      const deleted = new Set<string>()

      expect(resolveReplyTo(null, loaded, snapshots, deleted)).toBeNull()
    })

    it('donne la priorité au parent chargé en mémoire vive (fraîcheur)', () => {
      const loaded = new Map<string, RealtimeMessage>([['p-1', parentMsg]])
      const snapshots = new Map<string, ReplyPreview>([
        ['p-1', { id: 'p-1', authorName: 'Alice', content: 'Ancien texte', state: 'available' }],
      ])
      const deleted = new Set<string>()

      const result = resolveReplyTo('p-1', loaded, snapshots, deleted)
      expect(result).toEqual({
        id: 'p-1',
        authorName: 'Alice',
        content: 'Texte d origine',
        state: 'available',
      })
    })

    it('prend en compte la suppression en direct (deletedIds) même si chargé', () => {
      const loaded = new Map<string, RealtimeMessage>([['p-1', parentMsg]])
      const snapshots = new Map<string, ReplyPreview>()
      const deleted = new Set<string>(['p-1'])

      const result = resolveReplyTo('p-1', loaded, snapshots, deleted)
      expect(result).toEqual({
        id: 'p-1',
        authorName: 'Alice',
        content: null,
        state: 'deleted',
      })
    })

    it('utilise l instantané serveur si le parent est hors de la fenêtre chargée', () => {
      const loaded = new Map<string, RealtimeMessage>()
      const snapshots = new Map<string, ReplyPreview>([
        ['p-old', { id: 'p-old', authorName: 'Bob', content: 'Vieux message', state: 'available' }],
      ])
      const deleted = new Set<string>()

      const result = resolveReplyTo('p-old', loaded, snapshots, deleted)
      expect(result).toEqual({
        id: 'p-old',
        authorName: 'Bob',
        content: 'Vieux message',
        state: 'available',
      })
    })

    it('renvoie state: unknown si le parent est introuvable', () => {
      const loaded = new Map<string, RealtimeMessage>()
      const snapshots = new Map<string, ReplyPreview>()
      const deleted = new Set<string>()

      const result = resolveReplyTo('ghost', loaded, snapshots, deleted)
      expect(result).toEqual({
        id: 'ghost',
        authorName: null,
        content: null,
        state: 'unknown',
      })
    })
  })
})

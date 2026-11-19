import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as v from 'valibot'

const {
  authAccess,
  isChannelMember,
  getMessageForNotification,
  getChannelRecipients,
  sendPushNotificationToUserById,
} = vi.hoisted(() => ({
  authAccess: vi.fn(),
  isChannelMember: vi.fn(),
  getMessageForNotification: vi.fn(),
  getChannelRecipients: vi.fn(),
  sendPushNotificationToUserById: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/services/auth', () => ({ authAccess }))
vi.mock('@/services/channel-member/server', () => ({
  isChannelMember,
  getChannelRecipients,
}))
vi.mock('@/services/message/server', () => ({ getMessageForNotification }))
vi.mock('@/services/notification/server', () => ({ sendPushNotificationToUserById }))

import { notifyChannelMembersSchema } from '../validation'
import { notifyChannelMembers } from '../operations/notification.chat.mutations'
import { notifyChannelMembersAction } from '../actions/notification.chat.mutations'
import { MAX_NOTIFICATION_MESSAGE } from '../constants'

describe('chat notifications domain', () => {
  const validChannelId = '11111111-1111-4111-8111-111111111111'
  const validMessageId = '22222222-2222-4222-8222-222222222222'
  const validUserId1 = '33333333-3333-4333-8333-333333333333'
  const validUserId2 = '44444444-4444-4444-8444-444444444444'
  const orgId = 'org-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validation schema (notifyChannelMembersSchema)', () => {
    it('valide une entrée correcte sans excludedIds', () => {
      const input = { channelId: validChannelId, messageId: validMessageId }
      const parsed = v.safeParse(notifyChannelMembersSchema, input)

      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.output.channelId).toBe(validChannelId)
        expect(parsed.output.messageId).toBe(validMessageId)
        expect(parsed.output.excludedIds).toEqual([])
      }
    })

    it('valide une entrée avec excludedIds', () => {
      const input = {
        channelId: validChannelId,
        messageId: validMessageId,
        excludedIds: [validUserId1, validUserId2],
      }
      const parsed = v.safeParse(notifyChannelMembersSchema, input)

      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.output.excludedIds).toEqual([validUserId1, validUserId2])
      }
    })

    it('rejette un channelId invalide (non-UUID)', () => {
      const input = { channelId: 'not-a-uuid', messageId: validMessageId }
      const parsed = v.safeParse(notifyChannelMembersSchema, input)

      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        expect(parsed.issues[0]?.message).toBe('ID de canal invalide')
      }
    })

    it('rejette un messageId invalide (non-UUID)', () => {
      const input = { channelId: validChannelId, messageId: 'not-a-uuid' }
      const parsed = v.safeParse(notifyChannelMembersSchema, input)

      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        expect(parsed.issues[0]?.message).toBe('ID de message invalide')
      }
    })

    it('rejette un excludedIds contenant une valeur non-UUID', () => {
      const input = {
        channelId: validChannelId,
        messageId: validMessageId,
        excludedIds: ['not-a-uuid'],
      }
      const parsed = v.safeParse(notifyChannelMembersSchema, input)

      expect(parsed.success).toBe(false)
    })

    it('ne conserve aucun champ injecté par le client (ex: content)', () => {
      const input = {
        channelId: validChannelId,
        messageId: validMessageId,
        content: 'Faux message injecté côté client',
      }
      const parsed = v.safeParse(notifyChannelMembersSchema, input)

      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.output).not.toHaveProperty('content')
      }
    })
  })

  describe('operation (notifyChannelMembers)', () => {
    it('exclut toujours l expéditeur de la liste des destinataires', async () => {
      getChannelRecipients.mockResolvedValue([
        { userId: 'member-1', mutedAt: null },
        { userId: 'member-2', mutedAt: null },
      ])
      sendPushNotificationToUserById.mockResolvedValue({ id: 'push-1' })

      await notifyChannelMembers({
        orgId,
        channelId: validChannelId,
        messageId: validMessageId,
        content: 'Hello channel',
        senderId: validUserId1,
        senderName: 'Alice',
        parentUserId: null,
        excludedIds: [],
      })

      expect(getChannelRecipients).toHaveBeenCalledWith({
        channelId: validChannelId,
        excludedIds: [validUserId1],
      })
    })

    it('combine senderId et excludedIds sans perte', async () => {
      getChannelRecipients.mockResolvedValue([{ userId: 'member-2', mutedAt: null }])
      sendPushNotificationToUserById.mockResolvedValue({ id: 'push-1' })

      await notifyChannelMembers({
        orgId,
        channelId: validChannelId,
        messageId: validMessageId,
        content: 'Hello',
        senderId: validUserId1,
        senderName: 'Alice',
        parentUserId: null,
        excludedIds: [validUserId2],
      })

      expect(getChannelRecipients).toHaveBeenCalledWith({
        channelId: validChannelId,
        excludedIds: [validUserId1, validUserId2],
      })
    })

    it('tronque le contenu à MAX_NOTIFICATION_MESSAGE (500 caractères)', async () => {
      const longContent = 'A'.repeat(600)
      getChannelRecipients.mockResolvedValue([{ userId: 'member-1', mutedAt: null }])
      sendPushNotificationToUserById.mockResolvedValue({ id: 'push-1' })

      await notifyChannelMembers({
        orgId,
        channelId: validChannelId,
        messageId: validMessageId,
        content: longContent,
        senderId: validUserId1,
        senderName: 'Alice',
        parentUserId: null,
        excludedIds: [],
      })

      expect(sendPushNotificationToUserById).toHaveBeenCalledWith(
        'member-1',
        expect.objectContaining({
          message: 'A'.repeat(MAX_NOTIFICATION_MESSAGE),
        }),
      )
    })

    it('envoie une notification personnalisée au parentUserId et standard aux autres membres, sans double push', async () => {
      const parentUserId = 'parent-author-id'
      const otherMemberId = 'other-member-id'

      getChannelRecipients.mockResolvedValue([
        { userId: parentUserId, mutedAt: null },
        { userId: otherMemberId, mutedAt: null },
      ])
      sendPushNotificationToUserById.mockResolvedValue({ id: 'push-1' })

      await notifyChannelMembers({
        orgId,
        channelId: validChannelId,
        messageId: validMessageId,
        content: 'Merci pour ta réponse !',
        senderId: validUserId1,
        senderName: 'Bob',
        parentUserId,
        excludedIds: [],
      })

      // Exactement 2 appels push (1 par destinataire)
      expect(sendPushNotificationToUserById).toHaveBeenCalledTimes(2)

      // Le parentUserId reçoit la version dédiée
      expect(sendPushNotificationToUserById).toHaveBeenCalledWith(
        parentUserId,
        expect.objectContaining({
          message: 'Bob a répondu à votre message : Merci pour ta réponse !',
          resourceType: 'MESSAGE',
          resourceId: validMessageId,
          event: 'CREATED',
          metadata: { channelId: validChannelId },
        }),
      )

      // L'autre membre reçoit l'aperçu standard
      expect(sendPushNotificationToUserById).toHaveBeenCalledWith(
        otherMemberId,
        expect.objectContaining({
          message: 'Merci pour ta réponse !',
          resourceType: 'MESSAGE',
          resourceId: validMessageId,
          event: 'CREATED',
          metadata: { channelId: validChannelId },
        }),
      )
    })

    // ─────────────────────────────────────────────────────────────
    // TESTS SOURDINE (MUTE)
    // ─────────────────────────────────────────────────────────────

    it('ne notifie PAS un membre dont le canal est en sourdine (mutedAt !== null)', async () => {
      getChannelRecipients.mockResolvedValue([
        { userId: 'muted-member-1', mutedAt: new Date() },
        { userId: 'active-member-2', mutedAt: null },
      ])
      sendPushNotificationToUserById.mockResolvedValue({ id: 'push-1' })

      await notifyChannelMembers({
        orgId,
        channelId: validChannelId,
        messageId: validMessageId,
        content: 'Message général',
        senderId: validUserId1,
        senderName: 'Alice',
        parentUserId: null,
        excludedIds: [],
      })

      expect(sendPushNotificationToUserById).toHaveBeenCalledTimes(1)
      expect(sendPushNotificationToUserById).toHaveBeenCalledWith(
        'active-member-2',
        expect.anything(),
      )
      expect(sendPushNotificationToUserById).not.toHaveBeenCalledWith(
        'muted-member-1',
        expect.anything(),
      )
    })

    it('laisse passer la notification dédiée pour l auteur du message parent MÊME s il a coupé le canal (exception sourdine)', async () => {
      const parentUserId = 'muted-parent-author'
      getChannelRecipients.mockResolvedValue([
        { userId: parentUserId, mutedAt: new Date() }, // En sourdine !
        { userId: 'active-member', mutedAt: null },
        { userId: 'other-muted-member', mutedAt: new Date() }, // En sourdine aussi
      ])
      sendPushNotificationToUserById.mockResolvedValue({ id: 'push-1' })

      await notifyChannelMembers({
        orgId,
        channelId: validChannelId,
        messageId: validMessageId,
        content: 'Réponse à ta question',
        senderId: validUserId1,
        senderName: 'Bob',
        parentUserId,
        excludedIds: [],
      })

      // Le parent en sourdine ET le membre actif reçoivent le push (2 appels au total)
      expect(sendPushNotificationToUserById).toHaveBeenCalledTimes(2)

      // Le parent reçoit sa notification dédiée malgré sa sourdine
      expect(sendPushNotificationToUserById).toHaveBeenCalledWith(
        parentUserId,
        expect.objectContaining({
          message: 'Bob a répondu à votre message : Réponse à ta question',
        }),
      )

      // Le membre ordinaire en sourdine ne reçoit rien
      expect(sendPushNotificationToUserById).not.toHaveBeenCalledWith(
        'other-muted-member',
        expect.anything(),
      )
    })

    it('ne notifie pas l auteur du parent s il a quitté le canal ou s il est exclu', async () => {
      // getChannelRecipients ne le renvoie pas car il n'est plus membre ou fait partie des exclus
      getChannelRecipients.mockResolvedValue([
        { userId: 'active-member', mutedAt: null },
      ])
      sendPushNotificationToUserById.mockResolvedValue({ id: 'push-1' })

      await notifyChannelMembers({
        orgId,
        channelId: validChannelId,
        messageId: validMessageId,
        content: 'Réponse',
        senderId: validUserId1,
        senderName: 'Bob',
        parentUserId: 'ex-member-author', // pas dans le résultat de getChannelRecipients
        excludedIds: [],
      })

      expect(sendPushNotificationToUserById).toHaveBeenCalledTimes(1)
      expect(sendPushNotificationToUserById).toHaveBeenCalledWith(
        'active-member',
        expect.anything(),
      )
    })
  })

  describe('server action (notifyChannelMembersAction)', () => {
    const mockUser = { id: validUserId1, name: 'Alice Dupont' }

    beforeEach(() => {
      authAccess.mockResolvedValue({
        data: { user: mockUser, orgId },
      })
      isChannelMember.mockResolvedValue(true)
      getChannelRecipients.mockResolvedValue([{ userId: 'member-1', mutedAt: null }])
      sendPushNotificationToUserById.mockResolvedValue({ id: 'push-1' })
    })

    it('refuse si l utilisateur n est pas authentifié', async () => {
      authAccess.mockResolvedValue({ data: null, error: 'Non authentifié' })

      const result = await notifyChannelMembersAction({
        channelId: validChannelId,
        messageId: validMessageId,
      })

      expect(result).toEqual({ error: 'Non authentifié' })
      expect(isChannelMember).not.toHaveBeenCalled()
      expect(getMessageForNotification).not.toHaveBeenCalled()
    })

    it('refuse si l input est invalide', async () => {
      const result = await notifyChannelMembersAction({
        channelId: 'invalid-id',
        messageId: validMessageId,
      })

      expect(result).toHaveProperty('error')
      expect(isChannelMember).not.toHaveBeenCalled()
    })

    it('refuse si l utilisateur n est pas membre du canal (protection orgId + channelId)', async () => {
      isChannelMember.mockResolvedValue(false)

      const result = await notifyChannelMembersAction({
        channelId: validChannelId,
        messageId: validMessageId,
      })

      expect(result).toEqual({ error: 'Accès refusé' })
      expect(getMessageForNotification).not.toHaveBeenCalled()
    })

    it('refuse si le message est introuvable ou supprimé en base (anti-faux push)', async () => {
      getMessageForNotification.mockResolvedValue(null)

      const result = await notifyChannelMembersAction({
        channelId: validChannelId,
        messageId: validMessageId,
      })

      expect(result).toEqual({ error: 'Accès refusé' })
      expect(getChannelRecipients).not.toHaveBeenCalled()
    })

    it('refuse si le message en base n appartient pas au canal spécifié', async () => {
      getMessageForNotification.mockResolvedValue({
        channelId: 'different-channel-id',
        userId: mockUser.id,
        content: 'Texte légitime',
        parent: null,
      })

      const result = await notifyChannelMembersAction({
        channelId: validChannelId,
        messageId: validMessageId,
      })

      expect(result).toEqual({ error: 'Accès refusé' })
      expect(getChannelRecipients).not.toHaveBeenCalled()
    })

    it('refuse si le message en base n a pas été rédigé par l expéditeur connecté (anti-usurpation)', async () => {
      getMessageForNotification.mockResolvedValue({
        channelId: validChannelId,
        userId: 'other-author-id',
        content: 'Texte d un autre auteur',
        parent: null,
      })

      const result = await notifyChannelMembersAction({
        channelId: validChannelId,
        messageId: validMessageId,
      })

      expect(result).toEqual({ error: 'Accès refusé' })
      expect(getChannelRecipients).not.toHaveBeenCalled()
    })

    it('neutralise parentUserId si le message parent a été supprimé', async () => {
      getMessageForNotification.mockResolvedValue({
        channelId: validChannelId,
        userId: mockUser.id,
        content: 'Réponse à un message supprimé',
        parent: {
          userId: 'parent-author-id',
          deletedAt: new Date(), // parent supprimé
        },
      })
      getChannelRecipients.mockResolvedValue([{ userId: 'parent-author-id', mutedAt: null }])

      const result = await notifyChannelMembersAction({
        channelId: validChannelId,
        messageId: validMessageId,
      })

      expect(result).toEqual({ data: true })

      // Le destinataire reçoit l'aperçu standard car le parent est supprimé
      expect(sendPushNotificationToUserById).toHaveBeenCalledWith(
        'parent-author-id',
        expect.objectContaining({
          message: 'Réponse à un message supprimé',
        }),
      )
    })

    it('transmet le parentUserId et le contenu réel de la base en cas de succès nominal', async () => {
      getMessageForNotification.mockResolvedValue({
        channelId: validChannelId,
        userId: mockUser.id,
        content: 'Contenu lu en base depuis la source de vérité',
        parent: {
          userId: 'parent-author-id',
          deletedAt: null,
        },
      })
      getChannelRecipients.mockResolvedValue([
        { userId: 'parent-author-id', mutedAt: null },
        { userId: 'member-2', mutedAt: null },
      ])

      const result = await notifyChannelMembersAction({
        channelId: validChannelId,
        messageId: validMessageId,
        excludedIds: [validUserId2],
      })

      expect(result).toEqual({ data: true })

      // getChannelRecipients a reçu les excludedIds
      expect(getChannelRecipients).toHaveBeenCalledWith({
        channelId: validChannelId,
        excludedIds: [mockUser.id, validUserId2],
      })

      // parent-author-id reçoit le message dédié
      expect(sendPushNotificationToUserById).toHaveBeenCalledWith(
        'parent-author-id',
        expect.objectContaining({
          message: 'Alice Dupont a répondu à votre message : Contenu lu en base depuis la source de vérité',
        }),
      )

      // member-2 reçoit le contenu de la base
      expect(sendPushNotificationToUserById).toHaveBeenCalledWith(
        'member-2',
        expect.objectContaining({
          message: 'Contenu lu en base depuis la source de vérité',
        }),
      )
    })
  })
})

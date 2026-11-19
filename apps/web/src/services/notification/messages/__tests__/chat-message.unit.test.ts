import { describe, expect, it } from 'vitest'
import {
  buildMessage,
  chatNotificationMessages,
} from '../message.messages'

describe('chat notification messages', () => {
  const senderName = 'Alice Dupont'
  const preview = 'Bonjour, réunion déplacée à 14h'

  describe('chatNotificationMessages.reply', () => {
    it('formate correctement le message de réponse dédiée', () => {
      const result = chatNotificationMessages.reply(senderName, preview)
      expect(result).toBe('Alice Dupont a répondu à votre message : Bonjour, réunion déplacée à 14h')
    })
  })

  describe('buildMessage', () => {
    it('renvoie la notification dédiée uniquement à l auteur du message cité (recipientId === parentUserId)', () => {
      const result = buildMessage({
        recipientId: 'user-author-parent',
        parentUserId: 'user-author-parent',
        senderName,
        preview,
      })

      expect(result).toBe('Alice Dupont a répondu à votre message : Bonjour, réunion déplacée à 14h')
    })

    it('renvoie l aperçu seul aux autres membres du canal (recipientId !== parentUserId)', () => {
      const result = buildMessage({
        recipientId: 'user-other-member',
        parentUserId: 'user-author-parent',
        senderName,
        preview,
      })

      expect(result).toBe('Bonjour, réunion déplacée à 14h')
    })

    it('renvoie l aperçu seul pour tous les destinataires si ce n est pas une réponse (parentUserId === null)', () => {
      const resultA = buildMessage({
        recipientId: 'user-1',
        parentUserId: null,
        senderName,
        preview,
      })
      const resultB = buildMessage({
        recipientId: 'user-2',
        parentUserId: null,
        senderName,
        preview,
      })

      expect(resultA).toBe('Bonjour, réunion déplacée à 14h')
      expect(resultB).toBe('Bonjour, réunion déplacée à 14h')
    })

    it('garantit qu un destinataire différent ne reçoit jamais par erreur la mention "a répondu à votre message"', () => {
      const result = buildMessage({
        recipientId: 'user-not-parent',
        parentUserId: 'user-parent',
        senderName,
        preview,
      })

      expect(result).not.toContain('a répondu à votre message')
      expect(result).toBe(preview)
    })
  })
})

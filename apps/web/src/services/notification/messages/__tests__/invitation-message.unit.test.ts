import { describe, it, expect } from 'vitest'
import { Resource, NotificationEvent } from '@/generated/prisma/browser'
import {
  buildInvitationNotificationPayload,
  buildInvitationResponsePayload,
  type InvitationNotificationSource,
} from '../invitation.messages'
import {
  resolveInvitationAction,
  readInvitationContext,
  INVITATION_ACCEPT_LABELS,
} from '@/modules/invitation/utils'

describe('modules/invitation/message', () => {
  describe('resolveInvitationAction', () => {
    it('returns JOIN_CLASS when resourceType is CLASS for existing member', () => {
      expect(
        resolveInvitationAction({ resourceType: Resource.CLASS, isExistingMember: true }),
      ).toBe('JOIN_CLASS')
    })

    it('returns JOIN_CLASS when resourceType is CLASS for new member', () => {
      expect(
        resolveInvitationAction({ resourceType: Resource.CLASS, isExistingMember: false }),
      ).toBe('JOIN_CLASS')
    })

    it('returns GRANT_ROLE when no resourceType and user is already a member', () => {
      expect(
        resolveInvitationAction({ resourceType: null, isExistingMember: true }),
      ).toBe('GRANT_ROLE')
    })

    it('returns JOIN_ORG when no resourceType and user is not a member', () => {
      expect(
        resolveInvitationAction({ resourceType: null, isExistingMember: false }),
      ).toBe('JOIN_ORG')
    })
  })

  describe('buildInvitationNotificationPayload', () => {
    const baseSource: InvitationNotificationSource = {
      invitationId: 'inv-123',
      expiresAt: new Date('2026-12-31T23:59:59.000Z'),
      role: 'STUDENT',
      organization: { id: 'org-1', name: 'Lycée Victor Hugo', slug: 'lycee-victor-hugo' },
      sender: { id: 'u-0', name: 'M. Le Proviseur' },
    }

    it('builds JOIN_CLASS message for existing member without repeating org name', () => {
      const payload = buildInvitationNotificationPayload({
        ...baseSource,
        resourceType: Resource.CLASS,
        resourceId: 'class-1',
        resourceName: 'Terminale S2',
        isExistingMember: true,
      })

      expect(payload.orgId).toBe('org-1')
      expect(payload.resourceType).toBe(Resource.INVITATION)
      expect(payload.resourceId).toBe('inv-123')
      expect(payload.event).toBe(NotificationEvent.CREATED)
      expect(payload.message).toBe('Vous avez été invité à rejoindre la classe Terminale S2.')
      expect((payload.metadata as any)?.action).toBe('JOIN_CLASS')
      expect((payload.metadata as any)?.target).toEqual({
        type: Resource.CLASS,
        id: 'class-1',
        name: 'Terminale S2',
      })
      expect((payload.metadata as any)?.sendBy).toEqual(baseSource.sender)
      expect((payload.metadata as any)?.status).toBe('PENDING')
      expect((payload.metadata as any)?.expiresAt).toBe('2026-12-31T23:59:59.000Z')
    })

    it('builds JOIN_CLASS message for new member mentioning the org', () => {
      const payload = buildInvitationNotificationPayload({
        ...baseSource,
        resourceType: Resource.CLASS,
        resourceId: 'class-1',
        resourceName: 'Terminale S2',
        isExistingMember: false,
      })

      expect(payload.message).toBe(
        'Vous avez été invité à rejoindre la classe Terminale S2 de Lycée Victor Hugo.',
      )
      expect((payload.metadata as any)?.action).toBe('JOIN_CLASS')
    })

    it('falls back to "une classe" if resourceName is null', () => {
      const payload = buildInvitationNotificationPayload({
        ...baseSource,
        resourceType: Resource.CLASS,
        resourceId: 'class-1',
        resourceName: null,
        isExistingMember: true,
      })

      expect(payload.message).toBe('Vous avez été invité à rejoindre une classe.')
    })

    it('builds GRANT_ROLE message when member is already in the org', () => {
      const payload = buildInvitationNotificationPayload({
        ...baseSource,
        role: 'TEACHER',
        resourceType: null,
        isExistingMember: true,
      })

      expect(payload.message).toBe('Lycée Victor Hugo vous propose le rôle de enseignant.')
      expect((payload.metadata as any)?.action).toBe('GRANT_ROLE')
      expect((payload.metadata as any)?.target).toBeUndefined()
    })

    it('builds JOIN_ORG message for a brand new user', () => {
      const payload = buildInvitationNotificationPayload({
        ...baseSource,
        role: 'STUDENT',
        resourceType: null,
        isExistingMember: false,
      })

      expect(payload.message).toBe(
        'Vous avez été invité à rejoindre Lycée Victor Hugo en tant que étudiant.',
      )
      expect((payload.metadata as any)?.action).toBe('JOIN_ORG')
      expect((payload.metadata as any)?.role).toBe('STUDENT')
    })

    it('falls back to "une organisation" if organization name is missing', () => {
      const payload = buildInvitationNotificationPayload({
        ...baseSource,
        organization: { id: 'org-1' },
        resourceType: null,
        isExistingMember: false,
      })

      expect(payload.message).toBe(
        'Vous avez été invité à rejoindre une organisation en tant que étudiant.',
      )
    })

    it('does not build a target when resourceId is missing', () => {
      const payload = buildInvitationNotificationPayload({
        ...baseSource,
        resourceType: Resource.CLASS,
        resourceId: null,
        resourceName: 'Terminale S2',
        isExistingMember: true,
      })

      expect((payload.metadata as any)?.target).toBeUndefined()
    })
  })

  describe('buildInvitationResponsePayload', () => {
    const sender = { id: 'u-1', name: 'Jean Dupont' }

    it('formats acceptance response for JOIN_CLASS referencing the class name', () => {
      const payload = buildInvitationResponsePayload({
        event: 'CONFIRMED',
        invitationId: 'inv-123',
        orgId: 'org-1',
        orgName: 'Lycée Victor Hugo',
        action: 'JOIN_CLASS',
        resourceId: 'class-1',
        resourceName: '6ème A',
        sender,
      })

      expect(payload.orgId).toBe('org-1')
      expect(payload.resourceType).toBe(Resource.INVITATION)
      expect(payload.resourceId).toBe('inv-123')
      expect(payload.event).toBe(NotificationEvent.CONFIRMED)
      expect(payload.message).toBe(
        'Jean Dupont a accepté votre invitation à rejoindre la classe 6ème A.',
      )
      expect((payload.metadata as any)?.action).toBe('JOIN_CLASS')
      expect((payload.metadata as any)?.target).toEqual({
        type: Resource.CLASS,
        id: 'class-1',
        name: '6ème A',
      })
      expect((payload.metadata as any)?.sendBy).toEqual(sender)
    })

    it('formats decline response for JOIN_CLASS referencing the class name', () => {
      const payload = buildInvitationResponsePayload({
        event: 'REJECTED',
        invitationId: 'inv-123',
        orgId: 'org-1',
        orgName: 'Lycée Victor Hugo',
        action: 'JOIN_CLASS',
        resourceId: 'class-1',
        resourceName: '6ème A',
        sender,
      })

      expect(payload.resourceType).toBe(Resource.INVITATION)
      expect(payload.resourceId).toBe('inv-123')
      expect(payload.event).toBe(NotificationEvent.REJECTED)
      expect(payload.message).toBe(
        'Jean Dupont a décliné votre invitation à rejoindre la classe 6ème A.',
      )
    })

    it('falls back to "une classe" for JOIN_CLASS without resourceName', () => {
      const payload = buildInvitationResponsePayload({
        event: 'CONFIRMED',
        invitationId: 'inv-123',
        orgId: 'org-1',
        orgName: 'Lycée Victor Hugo',
        action: 'JOIN_CLASS',
        sender,
      })

      expect(payload.message).toBe('Jean Dupont a accepté votre invitation à rejoindre une classe.')
      expect((payload.metadata as any)?.target).toBeUndefined()
    })

    it('formats acceptance response for JOIN_ORG referencing the org name', () => {
      const payload = buildInvitationResponsePayload({
        event: 'CONFIRMED',
        invitationId: 'inv-123',
        orgId: 'org-1',
        orgName: 'Lycée Victor Hugo',
        action: 'JOIN_ORG',
        sender,
      })

      expect(payload.event).toBe(NotificationEvent.CONFIRMED)
      expect(payload.message).toBe(
        'Jean Dupont a accepté votre invitation à rejoindre Lycée Victor Hugo.',
      )
      expect((payload.metadata as any)?.target).toBeUndefined()
    })

    it('formats decline response for JOIN_ORG', () => {
      const payload = buildInvitationResponsePayload({
        event: 'REJECTED',
        invitationId: 'inv-123',
        orgId: 'org-1',
        orgName: 'Lycée Victor Hugo',
        action: 'JOIN_ORG',
        sender,
      })

      expect(payload.event).toBe(NotificationEvent.REJECTED)
      expect(payload.message).toBe(
        'Jean Dupont a décliné votre invitation à rejoindre Lycée Victor Hugo.',
      )
    })

    it('defaults action to JOIN_ORG when action is missing', () => {
      const payload = buildInvitationResponsePayload({
        event: 'CONFIRMED',
        invitationId: 'inv-123',
        orgId: 'org-1',
        orgName: 'Lycée Victor Hugo',
        sender,
      })

      expect((payload.metadata as any)?.action).toBe('JOIN_ORG')
    })

    it('falls back to email then to "Un utilisateur" when sender has no name', () => {
      const withEmail = buildInvitationResponsePayload({
        event: 'CONFIRMED',
        invitationId: 'inv-123',
        orgId: 'org-1',
        orgName: 'Lycée Victor Hugo',
        action: 'JOIN_ORG',
        sender: { id: 'u-2', email: 'jean@example.com' } as any,
      })
      expect(withEmail.message).toBe(
        'jean@example.com a accepté votre invitation à rejoindre Lycée Victor Hugo.',
      )

      const anonymous = buildInvitationResponsePayload({
        event: 'CONFIRMED',
        invitationId: 'inv-123',
        orgId: 'org-1',
        orgName: 'Lycée Victor Hugo',
        action: 'JOIN_ORG',
        sender: { id: 'u-3' } as any,
      })
      expect(anonymous.message).toBe(
        'Un utilisateur a accepté votre invitation à rejoindre Lycée Victor Hugo.',
      )
    })
  })

  describe('readInvitationContext & INVITATION_ACCEPT_LABELS', () => {
    it('reads action and resourceName correctly from metadata', () => {
      const ctx = readInvitationContext({ action: 'JOIN_CLASS', resourceName: '5e B' })
      expect(ctx.action).toBe('JOIN_CLASS')
      expect(ctx.resourceName).toBe('5e B')
      expect(INVITATION_ACCEPT_LABELS[ctx.action!]).toBe('Rejoindre la classe')
    })

    it('returns nulls when metadata is missing fields', () => {
      const ctx = readInvitationContext({})
      expect(ctx.action).toBeNull()
      expect(ctx.resourceName).toBeNull()
    })

    it('returns nulls when metadata is null or undefined', () => {
      expect(readInvitationContext(null)).toEqual({ action: null, resourceName: null })
      expect(readInvitationContext(undefined)).toEqual({ action: null, resourceName: null })
    })

    it('exposes a label for each action', () => {
      expect(INVITATION_ACCEPT_LABELS).toEqual({
        JOIN_ORG: 'Accepter',
        JOIN_CLASS: 'Rejoindre la classe',
        GRANT_ROLE: 'Accepter le rôle',
      })
    })
  })
})
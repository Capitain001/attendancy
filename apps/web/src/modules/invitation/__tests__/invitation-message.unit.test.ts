import { describe, it, expect } from 'vitest'
import { Resource } from '@/generated/prisma/browser'
import {
  resolveInvitationAction,
  readInvitationContext,
  buildInvitationNotificationPayload,
  buildInvitationResponsePayload,
  INVITATION_ACCEPT_LABELS,
  type InvitationNotificationSource,
} from '../message'

describe('modules/invitation/message', () => {
  describe('resolveInvitationAction', () => {
    it('returns JOIN_CLASS when resourceType is CLASS for existing member', () => {
      const action = resolveInvitationAction({
        resourceType: Resource.CLASS,
        isExistingMember: true,
      })
      expect(action).toBe('JOIN_CLASS')
    })

    it('returns JOIN_CLASS when resourceType is CLASS for new member', () => {
      const action = resolveInvitationAction({
        resourceType: Resource.CLASS,
        isExistingMember: false,
      })
      expect(action).toBe('JOIN_CLASS')
    })

    it('returns GRANT_ROLE when no resourceType and user is already a member', () => {
      const action = resolveInvitationAction({
        resourceType: null,
        isExistingMember: true,
      })
      expect(action).toBe('GRANT_ROLE')
    })

    it('returns JOIN_ORG when no resourceType and user is not a member', () => {
      const action = resolveInvitationAction({
        resourceType: null,
        isExistingMember: false,
      })
      expect(action).toBe('JOIN_ORG')
    })
  })

  describe('buildInvitationNotificationPayload', () => {
    const baseSource: InvitationNotificationSource = {
      invitationId: 'inv-123',
      expiresAt: new Date('2026-12-31T23:59:59.000Z'),
      role: 'STUDENT',
      organization: { id: 'org-1', name: 'Lycée Victor Hugo', slug: 'lycee-victor-hugo' },
      senderName: 'M. Le Proviseur',
    }

    it('builds JOIN_CLASS message for existing member without repeating org name', () => {
      const payload = buildInvitationNotificationPayload({
        ...baseSource,
        resourceType: Resource.CLASS,
        resourceName: 'Terminale S2',
        isExistingMember: true,
      })

      expect(payload.type).toBe('INVITATION')
      expect(payload.message).toBe('Vous avez été invité à rejoindre la classe Terminale S2.')
      expect(payload.metadata.action).toBe('JOIN_CLASS')
      expect(payload.metadata.resourceName).toBe('Terminale S2')
      expect(payload.metadata.kind).toBe('INVITATION_RECEIVED')
      expect(payload.metadata.status).toBe('PENDING')
    })

    it('builds JOIN_CLASS message for new member mentioning the org', () => {
      const payload = buildInvitationNotificationPayload({
        ...baseSource,
        resourceType: Resource.CLASS,
        resourceName: 'Terminale S2',
        isExistingMember: false,
      })

      expect(payload.message).toBe(
        'Vous avez été invité à rejoindre la classe Terminale S2 de Lycée Victor Hugo.',
      )
      expect(payload.metadata.action).toBe('JOIN_CLASS')
    })

    it('falls back to "une classe" if resourceName is null', () => {
      const payload = buildInvitationNotificationPayload({
        ...baseSource,
        resourceType: Resource.CLASS,
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
      expect(payload.metadata.action).toBe('GRANT_ROLE')
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
      expect(payload.metadata.action).toBe('JOIN_ORG')
    })
  })

  describe('buildInvitationResponsePayload', () => {
    it('formats acceptance response for JOIN_CLASS referencing the class name', () => {
      const payload = buildInvitationResponsePayload({
        kind: 'INVITATION_ACCEPTED',
        invitationId: 'inv-123',
        orgId: 'org-1',
        orgName: 'Lycée Victor Hugo',
        action: 'JOIN_CLASS',
        resourceName: '6ème A',
        sender: { id: 'u-1', name: 'Jean Dupont' },
      })

      expect(payload.message).toBe('Jean Dupont a accepté votre invitation à rejoindre la classe 6ème A.')
      expect(payload.metadata.action).toBe('JOIN_CLASS')
      expect(payload.metadata.resourceName).toBe('6ème A')
    })

    it('formats decline response for JOIN_CLASS referencing the class name', () => {
      const payload = buildInvitationResponsePayload({
        kind: 'INVITATION_DECLINED',
        invitationId: 'inv-123',
        orgId: 'org-1',
        orgName: 'Lycée Victor Hugo',
        action: 'JOIN_CLASS',
        resourceName: '6ème A',
        sender: { id: 'u-1', name: 'Jean Dupont' },
      })

      expect(payload.message).toBe('Jean Dupont a décliné votre invitation à rejoindre la classe 6ème A.')
    })

    it('formats response for JOIN_ORG referencing the org name', () => {
      const payload = buildInvitationResponsePayload({
        kind: 'INVITATION_ACCEPTED',
        invitationId: 'inv-123',
        orgId: 'org-1',
        orgName: 'Lycée Victor Hugo',
        action: 'JOIN_ORG',
        sender: { id: 'u-1', name: 'Jean Dupont' },
      })

      expect(payload.message).toBe('Jean Dupont a accepté votre invitation à rejoindre Lycée Victor Hugo.')
    })
  })

  describe('readInvitationContext & INVITATION_ACCEPT_LABELS', () => {
    it('reads action and resourceName correctly from metadata', () => {
      const raw = { action: 'JOIN_CLASS', resourceName: '5e B', other: 123 }
      const ctx = readInvitationContext(raw)
      expect(ctx.action).toBe('JOIN_CLASS')
      expect(ctx.resourceName).toBe('5e B')
      expect(INVITATION_ACCEPT_LABELS[ctx.action!]).toBe('Rejoindre la classe')
    })

    it('returns nulls when metadata is missing fields', () => {
      const ctx = readInvitationContext({})
      expect(ctx.action).toBeNull()
      expect(ctx.resourceName).toBeNull()
    })
  })
})


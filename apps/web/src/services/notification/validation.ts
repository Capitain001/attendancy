// src/services/notification/validation.ts
import * as v from 'valibot'
import { Resource, NotificationEvent } from '@/generated/prisma/browser'
import { INVITATION_ACTIONS } from '@/modules/invitation/constants'
import type { CreateNotificationData } from './types'
import { ORGANIZATION_TYPES } from './constants'

export const resourceTypeSchema = v.enum(Resource)
export const notificationEventSchema = v.enum(NotificationEvent)

// ─── Metadata d'invitation ───────────────────────────────────────────────────

export const invitationMetadataSchema = v.object({
  kind: v.optional(v.string()),
  invitationId: v.optional(v.string()),
  orgId: v.optional(v.string()),
  orgName: v.optional(v.string()),
  orgSlug: v.optional(v.nullable(v.string())),
  orgType: v.optional(v.picklist(ORGANIZATION_TYPES)),
  role: v.optional(v.string()),
  resourceType: v.optional(v.string()),
  resourceName: v.optional(v.nullable(v.string())),
  action: v.optional(v.picklist(INVITATION_ACTIONS)),
  senderName: v.optional(v.string()),
  expiresAt: v.optional(v.string()),
  status: v.optional(v.string()),
})
export type InvitationMetadataOutput = v.InferOutput<typeof invitationMetadataSchema>

// ─── Metadata typée ──────────────────────────────────────────────────────────

export const notificationMetadataSchema = v.variant('kind', [
  v.object({ kind: v.literal('schedule') }),
  v.object({ kind: v.literal('message'), channelId: v.pipe(v.string(), v.uuid()) }),
  v.object({ ...invitationMetadataSchema.entries, kind: v.literal('invitation') }),
])
export type NotificationMetadata = v.InferOutput<typeof notificationMetadataSchema>

// ─── Création ────────────────────────────────────────────────────────────────

export const createNotificationSchema = v.pipe(
  v.object({
    message: v.pipe(v.string(), v.minLength(1), v.maxLength(500)),
    orgId: v.optional(v.string()),
    resourceType: v.optional(resourceTypeSchema),
    resourceId: v.optional(v.string()),
    event: v.optional(notificationEventSchema),
    metadata: v.optional(notificationMetadataSchema),
  } satisfies Record<keyof CreateNotificationData, unknown>),
  v.check(
    (n) => n.resourceId === undefined || n.resourceType !== undefined,
    'resourceType requis quand resourceId est fourni',
  ),
)
export type CreateNotificationInput = v.InferInput<typeof createNotificationSchema>
export type CreateNotificationOutput = v.InferOutput<typeof createNotificationSchema>

// ─── Boîte de réception ──────────────────────────────────────────────────────

export const inboxFilterSchema = v.picklist(['all', 'invitations', 'unread', 'system'] as const)
export type InboxFilter = v.InferOutput<typeof inboxFilterSchema>

export const getInboxNotificationsSchema = v.object({
  filter: v.optional(inboxFilterSchema, 'all'),
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
  cursor: v.optional(v.string()),
})
export type GetInboxNotificationsInput = v.InferInput<typeof getInboxNotificationsSchema>

export const markNotificationAsReadSchema = v.object({
  notificationId: v.pipe(v.string(), v.uuid('ID de notification invalide')),
})
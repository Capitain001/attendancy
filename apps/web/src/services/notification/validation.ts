// src/services/notification/validation.ts
import * as v from 'valibot'
import type { Prisma } from '@/generated/prisma/client'
import { Resource, NotificationEvent } from '@/generated/prisma/browser'
import type { CreateNotificationData } from './types'
import { ORGANIZATION_TYPES } from './constants'

const jsonValue = v.custom<Prisma.InputJsonValue>(() => true) // JSON libre

export const resourceTypeSchema = v.enum(Resource)
export const notificationEventSchema = v.enum(NotificationEvent)

// ─── Création ────────────────────────────────────────────────────────────────

export const createNotificationSchema = v.pipe(
  v.object({
    message: v.pipe(v.string(), v.trim(), v.minLength(1, 'Message requis'), v.maxLength(500)),
    orgId: v.optional(v.pipe(v.string(), v.uuid('ID invalide'))),
    resourceType: v.optional(resourceTypeSchema),
    resourceId: v.optional(v.pipe(v.string(), v.uuid('ID invalide'))),
    event: v.optional(notificationEventSchema),
    metadata: v.optional(jsonValue),
  } satisfies Record<keyof CreateNotificationData, unknown>),
  // Miroir du CHECK SQL notification_resource_id_needs_type
  v.check(
    (n) => n.resourceId === undefined || n.resourceType !== undefined,
    'resourceType requis quand resourceId est fourni',
  ),
)

export type CreateNotificationInput = v.InferInput<typeof createNotificationSchema>
export type CreateNotificationOutput = v.InferOutput<typeof createNotificationSchema>

// ─── Boîte de réception (Inbox) ───────────────────────────────────────────────

export const inboxFilterSchema = v.picklist(['all', 'invitations', 'unread', 'system'] as const)
export type InboxFilter = v.InferOutput<typeof inboxFilterSchema>

export const getInboxNotificationsSchema = v.object({
  filter: v.optional(inboxFilterSchema, 'all'),
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
  cursor: v.optional(v.pipe(v.string(), v.uuid('ID invalide'))),
})
export type GetInboxNotificationsInput = v.InferInput<typeof getInboxNotificationsSchema>

export const markNotificationAsReadSchema = v.object({
  notificationId: v.pipe(v.string(), v.uuid('ID de notification invalide')),
})
export type MarkNotificationAsReadInput = v.InferInput<typeof markNotificationAsReadSchema>

// ─── Metadata d'invitation (lecture tolérante) ───────────────────────────────

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
  action: v.optional(v.picklist(['JOIN_ORG', 'JOIN_CLASS', 'GRANT_ROLE'] as const)),
  senderName: v.optional(v.string()),
  expiresAt: v.optional(v.string()),
  status: v.optional(v.string()),
})
export type InvitationMetadataOutput = v.InferOutput<typeof invitationMetadataSchema>
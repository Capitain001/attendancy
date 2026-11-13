// src/services/notification/validation.ts
import * as v from 'valibot'
import { Resource, NotificationEvent } from '@/generated/prisma/browser'
import type { AdminNotificationData } from './types'

export const resourceTypeSchema = v.enum(Resource)
export const notificationEventSchema = v.enum(NotificationEvent)

// ─── Création par un admin ───────────────────────────────────────────────────

export const createAdminNotificationSchema = v.pipe(
  v.object({
    message: v.pipe(v.string(), v.trim(), v.minLength(1, 'Message requis'), v.maxLength(500)),
    resourceType: v.optional(resourceTypeSchema),
    resourceId: v.optional(v.pipe(v.string(), v.uuid('ID invalide'))),
    event: v.optional(notificationEventSchema),
  } satisfies Record<keyof AdminNotificationData, unknown>),
  v.check(
    (n) => n.resourceId === undefined || n.resourceType !== undefined,
    'resourceType requis quand resourceId est fourni',
  ),
)
export type CreateAdminNotificationInput = v.InferInput<typeof createAdminNotificationSchema>
export type CreateAdminNotificationOutput = v.InferOutput<typeof createAdminNotificationSchema>

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
export type MarkNotificationAsReadInput = v.InferInput<typeof markNotificationAsReadSchema>

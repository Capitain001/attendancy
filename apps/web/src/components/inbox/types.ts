// src/components/inbox/types.ts
import type { Resource, NotificationEvent } from '@/generated/prisma/browser'
import type { NotificationMetadataFor } from '@/services/notification/types'

export type EnrichedInboxNotification = {
  id: string
  orgId?: string | null
  resourceType?: Resource | null
  resourceId?: string | null
  event?: NotificationEvent | null
  message: string
  read: boolean
  createdAt: string | Date
  updatedAt?: string | Date
  userId?: string
  readAt?: string | Date | null
  metadata?: (Partial<NotificationMetadataFor<'INVITATION'>> & {
    orgLogo?: string | null
    orgName?: string
    orgSlug?: string | null
    orgType?: string
    senderName?: string
    expiresAt?: string
    status?: string
  }) | null
}

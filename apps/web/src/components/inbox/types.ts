// src/components/inbox/types.ts
import type { Resource, NotificationEvent } from '@/generated/prisma/browser'
import type { InvitationMetadataOutput } from '@/services/notification/validation'

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
  metadata?: (InvitationMetadataOutput & {
    orgLogo?: string | null
    orgName?: string
    orgSlug?: string | null
  }) | null
}

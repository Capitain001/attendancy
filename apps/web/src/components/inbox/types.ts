// src/components/inbox/types.ts
import type { NotificationType } from '@attendancy/types'
import type { InvitationMetadataOutput } from '@/services/notification/validation'

export type EnrichedInboxNotification = {
  id: string
  type: NotificationType
  message: string
  read: boolean
  createdAt: string | Date
  updatedAt?: string | Date
  scheduleId?: string | null
  userId?: string
  orgId?: string | null
  readAt?: string | Date | null
  metadata?: (InvitationMetadataOutput & {
    orgLogo?: string | null
    orgName?: string
    orgSlug?: string | null
  }) | null
}

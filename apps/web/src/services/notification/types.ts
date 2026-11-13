// src/services/notification/types.ts
import type { getNotificationsForUser } from './database/notification.queries'
import type { getPushSubscriptionsByUserId } from './database/push.queries'

// Types dérivés Prisma — propres à ce service
export type NotificationItem      = Awaited<ReturnType<typeof getNotificationsForUser>>[number]
export type PushSubscriptionItem  = Awaited<ReturnType<typeof getPushSubscriptionsByUserId>>[number]

// types.ts
export * from './generated.types'

import type { Prisma } from '@/generated/prisma/client'

export type CreateNotificationData = Pick<
  Prisma.NotificationUncheckedCreateInput,
  'message' | 'orgId' | 'resourceType' | 'resourceId' | 'event' | 'metadata'
>

export type NotificationStats = {
  total: number
  unread: number
  read: number
  byType: Partial<Record<string, number>>
  uniqueUsers: number
}

export type PushSubscriptionStats = {
  totalSubscriptions: number
  activeSubscriptions: number
  expiredSubscriptions: number
  uniqueUsers: number
}

export * from './generated.types'

import type { getNotificationsForUser } from './database/notification.queries'
import type { getPushSubscriptionsByUserId } from './database/push.queries'

// Types dérivés Prisma — propres à ce service
export type NotificationItem      = Awaited<ReturnType<typeof getNotificationsForUser>>[number]
export type PushSubscriptionItem  = Awaited<ReturnType<typeof getPushSubscriptionsByUserId>>[number]

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

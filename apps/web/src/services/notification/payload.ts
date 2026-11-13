import { buildPushPayload } from '@/modules/notification/server'
import { NOTIFICATION_CONFIG, NOTIFICATION_TITLES } from '@/config/notification'
import type { NotificationPayload } from './types'

export function buildNotificationPushPayload(
  userId: string,
  payload: NotificationPayload & { title?: string },
): string {
  const title =
    payload.title ??
    (payload.resourceType && payload.resourceType in NOTIFICATION_TITLES
      ? NOTIFICATION_TITLES[payload.resourceType as keyof typeof NOTIFICATION_TITLES]
      : 'Notification 🔔')

  return buildPushPayload({
    title,
    body: payload.message,
    icon: NOTIFICATION_CONFIG.defaultIcon,
    data: {
      userId,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      event: payload.event,
    },
  })
}
// src/services/notification/utils.ts
import type { Resource, NotificationEvent } from '@/generated/prisma/browser'
import type { NotificationMetadataFor } from './types'

// Un seul cast, localisé ici : le JSON de la base n'est pas typé.
export function getNotificationMetadata<R extends Resource>(
  n: { resourceType: Resource | null; metadata?: unknown },
  type: R,
): NotificationMetadataFor<R> | null {
  if (n.resourceType !== type || !n.metadata || typeof n.metadata !== 'object') return null
  return n.metadata as NotificationMetadataFor<R>
}

export function getNotificationHref(n: {
  resourceType: Resource | null
  resourceId: string | null
  metadata?: unknown
}): string | null {
  if (!n.resourceType || !n.resourceId) return null
  switch (n.resourceType) {
    case 'SCHEDULE':   return `/planning/${n.resourceId}`
    case 'ATTENDANCE': return `/absences/${n.resourceId}`
    case 'INVITATION': return `/invitations/${n.resourceId}`
    case 'MESSAGE': {
      const meta = getNotificationMetadata(n, 'MESSAGE')
      return meta ? `/messages/${meta.channelId}#${n.resourceId}` : null
    }
    default: return null
  }
}

export const EVENT_STYLE: Record<NotificationEvent, 'success' | 'warning' | 'danger' | 'info'> = {
  CREATED: 'success',
  UPDATED: 'warning',
  CONFIRMED: 'success',
  REJECTED: 'danger',
  CANCELED: 'danger',
  ASSIGNED: 'info',
  UNASSIGNED: 'warning',
}

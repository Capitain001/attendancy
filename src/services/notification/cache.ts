import { CACHE } from '@/cache/server/key'

export const NOTIFICATION_GRAPH = {
  NOTIFICATION_CREATED: (userId: string) => [CACHE.NOTIFICATION(userId)],
  NOTIFICATION_READ: (userId: string) => [CACHE.NOTIFICATION(userId)],
  NOTIFICATION_ALL_READ: (userId: string) => [CACHE.NOTIFICATION(userId)],
  NOTIFICATION_REMOVED: (userId: string) => [CACHE.NOTIFICATION(userId)],
} as const

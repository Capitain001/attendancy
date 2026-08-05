// src/services/schedule/cache.ts
import { CACHE } from '@/cache/server/key'

export const SCHEDULE_GRAPH = {
  SCHEDULE_CREATED: (orgId: string, classId: string) => [
    CACHE.SCHEDULE(orgId),
    CACHE.SCHEDULE(orgId, classId),
  ],
  SCHEDULE_UPDATED: (orgId: string, classId: string) => [
    CACHE.SCHEDULE(orgId),
    CACHE.SCHEDULE(orgId, classId),
  ],
  SCHEDULE_REMOVED: (orgId: string, classId: string) => [
    CACHE.SCHEDULE(orgId),
    CACHE.SCHEDULE(orgId, classId),
  ],
} as const

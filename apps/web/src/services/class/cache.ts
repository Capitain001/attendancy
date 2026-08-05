// src/services/class/cache.ts
import { CACHE } from '@/cache/server/key'

export const CLASS_GRAPH = {
  CLASS_CREATED: (orgId: string) => [CACHE.CLASS(orgId)],
  CLASS_REMOVED: (orgId: string, classId: string) => [
    CACHE.CLASS(orgId),
    CACHE.CLASS(orgId, classId),
  ],
} as const

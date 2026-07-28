// src/services/group/cache.ts
// Groups sont inclus dans le select de getClass → invalider CACHE.CLASS.
import { CACHE } from '@/cache/server/key'

export const GROUP_GRAPH = {
  GROUP_CREATED: (orgId: string, classId: string) => [
    CACHE.CLASS(orgId),
    CACHE.CLASS(orgId, classId),
  ],
  GROUP_UPDATED: (orgId: string, classId: string) => [
    CACHE.CLASS(orgId),
    CACHE.CLASS(orgId, classId),
  ],
  GROUP_DELETED: (orgId: string, classId: string) => [
    CACHE.CLASS(orgId),
    CACHE.CLASS(orgId, classId),
  ],
} as const

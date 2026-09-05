// src/services/group/cache.ts
// Groups apparaissent dans deux caches : getClass (détail, select imbriqué)
// et getGroupsByClass (liste dédiée) → invalider CACHE.CLASS et CACHE.GROUP.
import { CACHE } from '@/cache/server/key'

export const GROUP_GRAPH = {
  GROUP_CREATED: (orgId: string, classId: string) => [
    CACHE.CLASS(orgId),
    CACHE.CLASS(orgId, classId),
    CACHE.GROUP(orgId, classId),
  ],
  GROUP_UPDATED: (orgId: string, classId: string) => [
    CACHE.CLASS(orgId),
    CACHE.CLASS(orgId, classId),
    CACHE.GROUP(orgId, classId),
  ],
  GROUP_REMOVED: (orgId: string, classId: string) => [
    CACHE.CLASS(orgId),
    CACHE.CLASS(orgId, classId),
    CACHE.GROUP(orgId, classId),
  ],
} as const

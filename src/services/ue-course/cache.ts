// src/services/ue-course/cache.ts
import { CACHE } from '@/cache/server/key'

export const UE_COURSE_GRAPH = {
  UE_COURSE_CREATED: (orgId: string, ueId: string) => [
    CACHE.UE_COURSE(orgId),
    CACHE.UE_COURSE(orgId, ueId),
  ],
  UE_COURSE_UPDATED: (orgId: string, ueId: string) => [
    CACHE.UE_COURSE(orgId),
    CACHE.UE_COURSE(orgId, ueId),
  ],
  UE_COURSE_REMOVED: (orgId: string, ueId: string) => [
    CACHE.UE_COURSE(orgId),
    CACHE.UE_COURSE(orgId, ueId),
  ],
} as const

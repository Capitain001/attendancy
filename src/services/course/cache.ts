// src/services/course/cache.ts
// COURSE mutations also invalidate CLASS (class detail shows course count).
import { CACHE } from '@/cache/server/key'

export const COURSE_GRAPH = {
  COURSE_CREATED: (orgId: string, classId: string) => [
    CACHE.COURSE(orgId),
    CACHE.COURSE(orgId, classId),
    CACHE.CLASS(orgId),
    CACHE.CLASS(orgId, classId),
  ],
  COURSE_UPDATED: (orgId: string, classId: string) => [
    CACHE.COURSE(orgId),
    CACHE.COURSE(orgId, classId),
    CACHE.CLASS(orgId, classId),
  ],
} as const

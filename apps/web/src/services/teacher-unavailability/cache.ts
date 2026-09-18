// src/services/teacher-unavailability/cache.ts
import { CACHE } from '@/cache/server/key';

export const TEACHER_UNAVAILABILITY_GRAPH = {
  TEACHER_UNAVAILABILITY_CREATED: (orgId: string, teacherId: string) => [
    CACHE.TEACHER_UNAVAILABILITY(orgId),
    CACHE.TEACHER_UNAVAILABILITY(orgId, teacherId),
  ],
  TEACHER_UNAVAILABILITY_UPDATED: (orgId: string, teacherId: string) => [
    CACHE.TEACHER_UNAVAILABILITY(orgId),
    CACHE.TEACHER_UNAVAILABILITY(orgId, teacherId),
  ],
  TEACHER_UNAVAILABILITY_DELETED: (orgId: string, teacherId: string) => [
    CACHE.TEACHER_UNAVAILABILITY(orgId),
    CACHE.TEACHER_UNAVAILABILITY(orgId, teacherId),
  ],
} as const;
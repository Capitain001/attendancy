// src/services/teacher/cache.ts
import { CACHE } from '@/cache/server/key'

export const TEACHER_GRAPH = {
  TEACHER_UPDATED: (orgId: string, teacherId: string) => [
    CACHE.TEACHER(orgId),
    CACHE.TEACHER(orgId, teacherId),
  ],
} as const

// src/services/student/cache.ts
// Student enrollments shown in class detail — invalidate CLASS + STUDENT tags.
import { CACHE } from '@/cache/server/key'

export const STUDENT_GRAPH = {
  STUDENT_ENROLLED: (orgId: string, classId: string) => [
    CACHE.STUDENT(orgId, classId),
    CACHE.CLASS(orgId),
    CACHE.CLASS(orgId, classId),
  ],
  STUDENT_UNENROLLED: (orgId: string, classId: string) => [
    CACHE.STUDENT(orgId, classId),
    CACHE.CLASS(orgId),
    CACHE.CLASS(orgId, classId),
  ],
  STUDENT_GROUP_ASSIGNED: (orgId: string, classId: string) => [
    CACHE.STUDENT(orgId, classId),
  ],
} as const

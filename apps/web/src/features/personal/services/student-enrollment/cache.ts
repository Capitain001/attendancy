import { CACHE } from "@/cache/server/key";

export const STUDENT_ENROLLMENT_GRAPH = {
  STUDENT_ENROLLMENT_CREATED: (orgId: string) => [CACHE.STUDENT_ENROLLMENT(orgId)],
  STUDENT_ENROLLMENT_UPDATED: (orgId: string, studentEnrollmentId: string) => [
    CACHE.STUDENT_ENROLLMENT(orgId),
    CACHE.STUDENT_ENROLLMENT(orgId, studentEnrollmentId),
  ],
  STUDENT_ENROLLMENT_DELETED: (orgId: string, studentEnrollmentId: string) => [
    CACHE.STUDENT_ENROLLMENT(orgId),
    CACHE.STUDENT_ENROLLMENT(orgId, studentEnrollmentId),
  ],
} as const;

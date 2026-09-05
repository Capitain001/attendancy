import { CACHE } from "@/cache/server/key";

export const STUDENT_ENROLLMENT_GRAPH = {
  STUDENT_ENROLLMENT_CREATED: (orgId: string, classId: string) => [
    CACHE.STUDENT_ENROLLMENT(orgId),
    CACHE.STUDENT_ENROLLMENT(orgId, classId),
    CACHE.CLASS(orgId, classId),
  ],
  STUDENT_ENROLLMENT_UPDATED: (orgId: string, classId: string, studentEnrollmentId: string) => [
    CACHE.STUDENT_ENROLLMENT(orgId),
    CACHE.STUDENT_ENROLLMENT(orgId, classId),
    CACHE.STUDENT_ENROLLMENT(orgId, studentEnrollmentId),
    CACHE.CLASS(orgId, classId),
  ],
  STUDENT_ENROLLMENT_REMOVED: (orgId: string, classId: string, studentEnrollmentId: string) => [
    CACHE.STUDENT_ENROLLMENT(orgId),
    CACHE.STUDENT_ENROLLMENT(orgId, classId),
    CACHE.STUDENT_ENROLLMENT(orgId, studentEnrollmentId),
    CACHE.CLASS(orgId, classId),
  ],
  // Import en masse (direction) : un seul événement plutôt que N appels
  // individuels — la boucle interne à enrollStudentsInClass n'invalide qu'une
  // fois, à la fin, quel que soit le nombre d'étudiants traités.
  STUDENT_ENROLLMENT_BULK_ENROLLED: (orgId: string, classId: string) => [
    CACHE.STUDENT_ENROLLMENT(orgId),
    CACHE.STUDENT_ENROLLMENT(orgId, classId),
    CACHE.CLASS(orgId, classId),
  ],
} as const;
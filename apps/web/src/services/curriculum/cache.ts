import { CACHE } from "@/cache/server/key";

export const CURRICULUM_GRAPH = {
    CURRICULUM_APPLIED: (orgId: string, classId: string) => [
    CACHE.TERM(orgId),
    CACHE.TERM(orgId, classId),
    // CACHE.COURSE(orgId),
    // CACHE.COURSE(orgId, classId),
  ],
  // legacy keys
  CURRICULUM_CREATED: (orgId: string) => [CACHE.CURRICULUM(orgId)],
  CURRICULUM_UPDATED: (orgId: string, curriculumId: string) => [
    CACHE.CURRICULUM(orgId),
    CACHE.CURRICULUM(orgId, curriculumId),
  ],
  CURRICULUM_DELETED: (orgId: string, curriculumId: string) => [
    CACHE.CURRICULUM(orgId),
    CACHE.CURRICULUM(orgId, curriculumId),
  ],
} as const;

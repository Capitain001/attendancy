import { CACHE } from "@/cache/server/key";

export const TEACHER_COURSE_HOURS_GRAPH = {
  TEACHER_COURSE_HOURS_CREATED: (orgId: string) => [CACHE.TEACHER_COURSE_HOURS(orgId)],
  TEACHER_COURSE_HOURS_UPDATED: (orgId: string, teacherCourseHoursId: string) => [
    CACHE.TEACHER_COURSE_HOURS(orgId),
    CACHE.TEACHER_COURSE_HOURS(orgId, teacherCourseHoursId),
  ],
  TEACHER_COURSE_HOURS_DELETED: (orgId: string, teacherCourseHoursId: string) => [
    CACHE.TEACHER_COURSE_HOURS(orgId),
    CACHE.TEACHER_COURSE_HOURS(orgId, teacherCourseHoursId),
  ],
} as const;

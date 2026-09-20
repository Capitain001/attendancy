import { cacheTag, cacheLife } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE } from "@/cache/server/key";

export async function getTeacherCourseHourss(orgId: string) {
  "use cache";
  cacheTag(CACHE.TEACHER_COURSE_HOURS(orgId));
  cacheLife(CACHE.TEACHER_COURSE_HOURS.life);
  // TODO: select explicite — pas de findMany({}) sans select
  return prisma.teacherCourseHours.findMany({
    where: { orgId },
    select: { id: true },
  });
}

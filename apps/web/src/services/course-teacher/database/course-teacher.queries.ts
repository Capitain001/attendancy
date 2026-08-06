// src/services/course-teacher/database/course-teacher.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getCourseTeachers(courseId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.COURSE_TEACHER(orgId, courseId))
  cacheLife(CACHE.COURSE_TEACHER.life)
  return prisma.courseTeacher.findMany({
    where: { course: { id: courseId, orgId, deletedAt: null } },
    select: {
      id: true, isMain: true, hours: true,
      teacher: {
        select: {
          id: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  })
}

export async function getCourseTeachersIds(courseId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.COURSE_TEACHER(orgId, courseId))
  cacheLife(CACHE.COURSE_TEACHER.life)
  return prisma.courseTeacher.findMany({
    where: { course: { id: courseId, orgId, deletedAt: null } },
    select: { id: true, teacherId: true, isMain: true },
  })
}

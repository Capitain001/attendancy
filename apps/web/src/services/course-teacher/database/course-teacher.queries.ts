// database/course-teacher.queries.ts
// src/services/course-teacher/database/course-teacher.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key';;;

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

export async function getTeacherCourses(teacherId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.TEACHER(orgId, teacherId))
  cacheLife(CACHE.TEACHER.life)

  const rows = await prisma.courseTeacher.findMany({
    where: {
      teacherId,
      course: { orgId, deletedAt: null },
    },
    select: {
      isMain: true,
      hours:true, // ici
      course: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
    },
    orderBy: { course: { name: 'asc' } },
  })

  return rows.map((r) => ({
    ...r.course,
    isMain: r.isMain,
    hours: r.hours,
  }))
}
// src/services/course/database/course.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getCourses(orgId: string) {
  'use cache'
  cacheTag(CACHE.COURSE(orgId))
  cacheLife(CACHE.COURSE.life)
  return prisma.course.findMany({
    where: { orgId, deletedAt: null },
    select: { id: true, name: true, classId: true },
    orderBy: { name: 'asc' },
  })
}

export async function getCourseTeachers(courseId: string, orgId: string) {
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
  return prisma.courseTeacher.findMany({
    where: { course: { id: courseId, orgId, deletedAt: null } },
    select: { id: true, teacherId: true, isMain: true },
  })
}

export async function getCourse(courseId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.COURSE(orgId))
  cacheTag(CACHE.COURSE(orgId, courseId))
  cacheLife(CACHE.COURSE.life)
  return prisma.course.findFirst({
    where: { id: courseId, orgId, deletedAt: null },
    select: {
      id: true, name: true, credits: true, durationDone: true, durationTotal: true,
      classId: true, termId: true,
      ueCourse: { select: { id: true, name: true, code: true } },
      teachers: {
        select: {
          id: true, isMain: true, hours: true,
          teacher: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  })
}

export async function getCoursesByClass(classId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.COURSE(orgId))
  cacheTag(CACHE.COURSE(orgId, classId))
  cacheLife(CACHE.COURSE.life)
  return prisma.course.findMany({
    where: { classId, orgId, deletedAt: null },
    select: {
      id: true, name: true, credits: true,
      durationDone: true, durationTotal: true,
      termId: true,
      ueCourse: {
        select: { id: true, name: true, code: true },
      },
      teachers: {
        select: {
          id: true, isMain: true, hours: true,
          teacher: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

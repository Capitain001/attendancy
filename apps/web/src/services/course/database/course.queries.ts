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

/**
 * Lookup léger d'appartenance — retourne l'id du cours + son classId.
 * Exposé pour les services voisins (ex. course-teacher) qui ont besoin de
 * vérifier l'ownership et de connaître le classId pour l'invalidation cache,
 * sans dupliquer un `prisma.course` sur un modèle qu'ils ne possèdent pas.
 */
export async function getCourseClassId(courseId: string, orgId: string) {
  return prisma.course.findFirst({
    where: { id: courseId, orgId, deletedAt: null },
    select: { id: true, classId: true },
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

export async function getCourseDetail(courseId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.COURSE(orgId))
  cacheTag(CACHE.COURSE(orgId, courseId))
  cacheLife(CACHE.COURSE.life)
  return prisma.course.findFirst({
    where: { id: courseId, orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      description: true,
      credits: true,
      durationDone: true,
      durationTotal: true,
      classId: true,
      termId: true,
      class: {
        select: {
          id: true,
          name: true,
          level: true,
          _count: { select: { studentEnrollments: true } },
        },
      },
      ueCourse: {
        select: { id: true, name: true, code: true, credits: true, duration: true },
      },
      teachers: {
        select: {
          id: true,
          teacherId: true,
          isMain: true,
          hours: true,
          teacher: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true, avatar_url: true } },
            },
          },
        },
      },
      schedules: {
        where: { deletedAt: null },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
          room: { select: { id: true, name: true } },
          attendances: { select: { status: true } },
        },
        orderBy: { startTime: 'asc' },
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

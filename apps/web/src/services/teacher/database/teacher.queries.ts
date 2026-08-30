// src/services/teacher/database/teacher.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getTeachers(orgId: string, departmentId?: string) {
  'use cache'
  cacheTag(CACHE.TEACHER(orgId))
  cacheLife(CACHE.TEACHER.life)
  return prisma.teacher.findMany({
    where: {
      orgId,
      deletedAt: null,
      ...(departmentId ? { departmentId } : {}),
    },
    select: {
      id: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar_url: true,
          status: true,
        },
      },
      _count: { select: { courses: true } },
    },
    orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
  })
}

export async function getTeacherTodaySchedules(teacherId: string, orgId: string) {
  const now = new Date()
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const end = new Date(now); end.setHours(23, 59, 59, 999)
  return prisma.schedule.findMany({
    where: { teacherId, orgId, deletedAt: null, startTime: { gte: start, lte: end } },
    select: {
      id: true, status: true, notes: true, startTime: true, endTime: true,
      course: { select: { id: true, name: true } },
      room: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
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
      course: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
    },
    orderBy: { course: { name: 'asc' } },
  })

  return rows.map((r) => ({
    ...r.course,
    isMain: r.isMain,
  }))
}

export async function getTeacherSchedules(
  teacherId: string,
  orgId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(orgId))
  cacheLife(CACHE.SCHEDULE.life)
  return prisma.schedule.findMany({
    where: {
      teacherId, orgId, deletedAt: null,
      startTime: { lt: rangeEnd },
      endTime: { gt: rangeStart },
    },
    select: {
      id: true, status: true, notes: true, startTime: true, endTime: true,
      course: { select: { id: true, name: true } },
      room: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  })
}


export async function getTeacher(teacherId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.TEACHER(orgId))
  cacheTag(CACHE.TEACHER(orgId, teacherId))
  cacheLife(CACHE.TEACHER.life)
  return prisma.teacher.findFirst({
    where: { id: teacherId, orgId, deletedAt: null },
    select: {
      id: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar_url: true,
          status: true,
        },
      },
      _count: { select: { courses: true } },
    },
  })
}

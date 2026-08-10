// src/services/schedule/database/schedule.queries.ts
import type { Schedule } from '@/generated/prisma/client'
import { cacheTag, cacheLife } from 'next/cache'
import { startOfMonth, endOfMonth } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

/* =========================
   SELECTS / INCLUDES
========================= */

const scheduleInclude = {
  course:  { select: { id: true, name: true } },
  room:    { select: { id: true, name: true } },
  class:   { select: { id: true, name: true } },
  group:   { select: { id: true, name: true } },
  teacher: {
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true, avatar_url: true } },
    },
  },
} as const

const dayScheduleSelect = {
  id: true,
  startTime: true,
  endTime: true,
  status: true,
  confirmed: true,
  classId: true,
  groupId: true,
  course: { select: { id: true, name: true } },
  room: { select: { id: true, name: true } },
  _count: { select: { attendances: true } },
} as const

/* =========================
   TYPES
========================= */

export type ScheduleFilterParams =
  Partial<
    Pick<
      Schedule,
      | 'classId'
      | 'groupId'
      | 'teacherId'
      | 'roomId'
      | 'weekRecurrenceId'
      | 'status'
      | 'confirmed'
    >
  > & {
    orgId: string
    academicYearId?: string
    rangeStart: Date
    rangeEnd: Date
  }

/* =========================
   BUILDER WHERE
========================= */

function buildScheduleWhere(params: ScheduleFilterParams) {
  const { orgId, academicYearId, rangeStart, rangeEnd, ...filters } = params

  if (rangeEnd <= rangeStart) {
    throw new Error('rangeEnd must be after rangeStart')
  }

  return {
    orgId,
    deletedAt: null,
    ...filters,
    ...(academicYearId ? { class: { academicYearId } } : {}),
    startTime: { lt: rangeEnd },
    endTime: { gt: rangeStart },
  }
}

/* =========================
   MAIN QUERY
========================= */

export async function getSchedules(params: ScheduleFilterParams) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(params.orgId))
  if (params.classId) cacheTag(CACHE.SCHEDULE(params.orgId, params.classId))
  cacheLife({ revalidate: 300 })

  return prisma.schedule.findMany({
    where: buildScheduleWhere(params),
    orderBy: { startTime: 'asc' },
    include: scheduleInclude,
  })
}

/* =========================
   DAY QUERY (org-wide — vue direction)
========================= */

export async function getDaySchedules(params: ScheduleFilterParams) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(params.orgId))
  if (params.classId) cacheTag(CACHE.SCHEDULE(params.orgId, params.classId))
  cacheLife({ revalidate: 60 })

  return prisma.schedule.findMany({
    where: buildScheduleWhere(params),
    orderBy: { startTime: 'asc' },
    select: dayScheduleSelect,
  })
}

/* =========================
   WRAPPERS MÉTIER
========================= */

export function getClassSchedules(
  params: Omit<ScheduleFilterParams, 'teacherId' | 'roomId'>,
) {
  return getSchedules(params)
}

export function getTeacherSchedules(
  params: Omit<ScheduleFilterParams, 'classId' | 'roomId'>,
) {
  return getSchedules(params)
}

export function getRoomSchedules(
  params: Omit<ScheduleFilterParams, 'classId' | 'teacherId'>,
) {
  return getSchedules(params)
}

/* =========================
   SCHEDULE BY CLASS (conservé — compatibilité actions)
========================= */


export function getSchedulesByClass(
  classId: string,
  orgId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  return getSchedules({
    orgId,
    classId,
    rangeStart,
    rangeEnd,
  })
}

/* =========================
   SCHEDULE BY COURSE (conservé)
========================= */

export async function getSchedulesByCourse(courseId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(orgId))
  cacheLife({ revalidate: 300 })

  return prisma.schedule.findMany({
    where: { courseId, orgId, deletedAt: null },
    include: scheduleInclude,
    orderBy: { startTime: 'asc' },
  })
}

/* =========================
   SCHEDULE DAYS — calendrier
========================= */

export async function getScheduleDays(orgId: string, month: string) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(orgId))
  cacheLife({ revalidate: 3600 })

  const start = startOfMonth(new Date(`${month}-01T00:00:00`))
  const end = endOfMonth(start)

  const rows = await prisma.$queryRaw<{ day: string }[]>`
    SELECT DISTINCT TO_CHAR("startTime", 'YYYY-MM-DD') AS day
    FROM "Schedule"
    WHERE "orgId" = ${orgId}::uuid
      AND "deletedAt" IS NULL
      AND "startTime" >= ${start}
      AND "startTime" <= ${end}
    ORDER BY day ASC
  `
  return rows.map((r) => r.day)
}

/* =========================
   NEXT SCHEDULE (dashboard prof)
========================= */

export async function getTeacherNextSchedule(teacherId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(orgId))
  cacheLife({ revalidate: 30 })

  const now = new Date()

  return prisma.schedule.findFirst({
    where: {
      orgId,
      teacherId,
      endTime: { gt: now },
      deletedAt: null,
    },
    orderBy: { startTime: 'asc' },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      confirmed: true,
      notes: true,
      course: {
        select: {
          name: true,
          ueCourse: { select: { code: true } },
        },
      },
      room: {
        select: { name: true, locationId: true },
      },
      class: {
        select: {
          name: true,
          level: true,
          _count: { select: { studentEnrollments: true } },
        },
      },
      group: {
        select: {
          name: true,
          _count: { select: { studentGroups: true } },
        },
      },
      session: {
        select: { id: true, status: true, checkIn: true },
      },
    },
  })
}

/* =========================
   TODAY CLASS SCHEDULES
========================= */

export async function getTodayClassSchedules(classId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(orgId))
  cacheTag(CACHE.SCHEDULE(orgId, classId))
  cacheLife({ revalidate: 900 })

  const start = new Date()
  start.setHours(0, 0, 0, 0)

  return prisma.schedule.findMany({
    where: {
      orgId,
      classId,
      deletedAt: null,
      startTime: { gte: start },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      course: {
        select: { name: true },
      },
      teacher: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      room: { select: { name: true } },
    },
    orderBy: { startTime: 'asc' },
    take: 40,
  })
}

/* =========================
   GUARD — jamais mis en cache
========================= */

export async function assertClassInOrg(classId: string, orgId: string) {
  const row = await prisma.class.findFirst({
    where: {
      id: classId,
      deletedAt: null,
      programTrack: { orgId },
    },
    select: { id: true },
  })

  if (!row) throw new Error('Classe introuvable')
}

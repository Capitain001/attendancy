// src/services/schedule/database/schedule.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { startOfMonth, endOfMonth } from 'date-fns'
import { prisma } from '@/lib/db'
import { CACHE } from '@/cache/server/key'

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

export async function getSchedulesByClass(
  classId: string,
  orgId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(orgId))
  cacheTag(CACHE.SCHEDULE(orgId, classId))
  cacheLife(CACHE.SCHEDULE.life)
  return prisma.schedule.findMany({
    where: {
      orgId,
      classId,
      deletedAt: null,
      startTime: { lt: rangeEnd },
      endTime:   { gt: rangeStart },
    },
    include: scheduleInclude,
    orderBy: { startTime: 'asc' },
  })
}

export async function getSchedules(
  orgId: string,
  params: {
    classId?:  string
    teacherId?: string
    roomId?:   string
    rangeStart: Date
    rangeEnd:   Date
  },
) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(orgId))
  if (params.classId) cacheTag(CACHE.SCHEDULE(orgId, params.classId))
  cacheLife(CACHE.SCHEDULE.life)
  return prisma.schedule.findMany({
    where: {
      orgId,
      deletedAt: null,
      ...(params.classId  ? { classId:  params.classId }  : {}),
      ...(params.teacherId ? { teacherId: params.teacherId } : {}),
      ...(params.roomId   ? { roomId:   params.roomId }   : {}),
      startTime: { lt: params.rangeEnd },
      endTime:   { gt: params.rangeStart },
    },
    include: scheduleInclude,
    orderBy: { startTime: 'asc' },
  })
}

export async function getScheduleDays(orgId: string, month: string) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(orgId))
  cacheLife(CACHE.SCHEDULE.life)

  const start = startOfMonth(new Date(`${month}-01T00:00:00`))
  const end   = endOfMonth(start)

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

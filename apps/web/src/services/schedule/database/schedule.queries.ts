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

export type ScheduleFilterParams = Partial<
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
  groupIds?: string[]
}

/* =========================
   BUILDER WHERE
========================= */

function buildScheduleWhere(params: ScheduleFilterParams) {
  const { orgId, academicYearId, rangeStart, rangeEnd, groupIds, ...filters } = params

  if (rangeEnd <= rangeStart) {
    throw new Error('rangeEnd must be after rangeStart')
  }

  const groupCondition = groupIds
    ? {
        OR: [
          { groupId: null },
          ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
        ],
      }
    : {}

  return {
    orgId,
    deletedAt: null,
    ...filters,
    ...groupCondition,
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

// src/services/schedule/database/schedule.queries.ts
import { Prisma } from '@/generated/prisma/client'

export type ScheduleDaysFilterParams = Partial<
  Pick<Schedule, 'teacherId' | 'classId' | 'groupId' | 'roomId' | 'weekRecurrenceId' | 'status' | 'confirmed'>
>

export async function getScheduleDays(
  orgId: string,
  month: string,
  filters: ScheduleDaysFilterParams = {},
) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(orgId))
  // Tags dédiés pour pouvoir revalider finement sur un enseignant/une classe
  // sans invalider tout le cache de l'org.
  if (filters.teacherId) cacheTag(CACHE.SCHEDULE(orgId, filters.teacherId))
  if (filters.classId) cacheTag(CACHE.SCHEDULE(orgId, filters.classId))
  cacheLife({ revalidate: 3600 })

  const start = startOfMonth(new Date(`${month}-01T00:00:00`))
  const end = endOfMonth(start)

  // Chaque condition écrite en literal Prisma.sql (pas de Prisma.raw) :
  // - aucun nom de colonne construit dynamiquement -> rien à faire taire
  //   côté linter de sécurité, aucun risque même théorique d'injection
  // - chaque colonne reste greppable/"find references" directement dans l'IDE
  // - `!= null` couvre undefined ET null en une seule comparaison
  const dynamicConditions: Prisma.Sql[] = []

  if (filters.teacherId != null) {
    dynamicConditions.push(Prisma.sql`"teacherId" = ${filters.teacherId}::uuid`)
  }
  if (filters.classId != null) {
    dynamicConditions.push(Prisma.sql`"classId" = ${filters.classId}::uuid`)
  }
  if (filters.groupId != null) {
    dynamicConditions.push(Prisma.sql`"groupId" = ${filters.groupId}::uuid`)
  }
  if (filters.roomId != null) {
    dynamicConditions.push(Prisma.sql`"roomId" = ${filters.roomId}::uuid`)
  }
  if (filters.weekRecurrenceId != null) {
    dynamicConditions.push(Prisma.sql`"weekRecurrenceId" = ${filters.weekRecurrenceId}::uuid`)
  }
  if (filters.status != null) {
    dynamicConditions.push(Prisma.sql`"status" = ${filters.status}::"ScheduleStatus"`)
  }
  if (filters.confirmed != null) {
    dynamicConditions.push(Prisma.sql`"confirmed" = ${filters.confirmed}`)
  }

  // Un seul "AND" préfixé au bloc joint, plutôt qu'un "AND" répété dans
  // chaque fragment (plus robuste : les fragments ne portent plus de logique de jointure).
  const extraWhere = dynamicConditions.length
    ? Prisma.sql`AND ${Prisma.join(dynamicConditions, ' AND ')}`
    : Prisma.empty

  const rows = await prisma.$queryRaw<{ day: string }[]>`
    SELECT DISTINCT TO_CHAR("startTime", 'YYYY-MM-DD') AS day
    FROM "Schedule"
    WHERE "orgId" = ${orgId}::uuid
      AND "deletedAt" IS NULL
      AND "startTime" >= ${start}
      AND "startTime" <= ${end}
      ${extraWhere}
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


export async function getTeacherSchedulesInfo(
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


/**
 * Dernière séance (Schedule) déjà entamée d'un cours — pour affichage
 * "résumé du cours" (date, statut, effectif, présence). Ne renvoie que les
 * séances passées ou en cours (startTime <= now) : une séance future n'est
 * pas "une session à revoir".
 */
export async function getCourseLastSchedule(courseId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(orgId))
  cacheLife({ revalidate: 60 })

  return prisma.schedule.findFirst({
    where: {
      courseId,
      orgId,
      deletedAt: null,
      startTime: { lte: new Date() },
    },
    orderBy: { startTime: 'desc' },
      select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      room: { select: { id: true, name: true } },
      attendances: {
        select: { status: true },
      },
    },
  })
}
 
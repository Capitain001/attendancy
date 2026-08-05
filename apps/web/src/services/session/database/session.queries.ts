import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

const activeSessionSelect = {
  id: true,
  status: true,
  checkIn: true,
  schedule: {
    select: {
      id: true,
      startTime: true,
      endTime: true,
      classId: true,
      groupId: true,
      course: { select: { name: true } },
      room: { select: { name: true } },
      teacher: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true, avatar_url: true } },
        },
      },
    },
  },
} as const

export async function getActiveSessions(orgId: string) {
  'use cache'
  cacheTag(CACHE.SESSION(orgId))
  cacheLife(CACHE.SESSION.life)
  return prisma.session.findMany({
    where: {
      status: 'ACTIVE',
      schedule: { orgId, deletedAt: null },
    },
    select: activeSessionSelect,
    orderBy: { schedule: { startTime: 'asc' } },
  })
}

export async function getOrgDaySchedulesWithSession(
  orgId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  return prisma.schedule.findMany({
    where: {
      orgId,
      deletedAt: null,
      startTime: { gte: rangeStart, lte: rangeEnd },
    },
    orderBy: { startTime: 'asc' },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      notes: true,
      course: { select: { id: true, name: true } },
      room: { select: { id: true, name: true } },
      class: {
        select: {
          id: true,
          name: true,
          _count: { select: { studentEnrollments: true } },
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          _count: { select: { studentGroups: true } },
        },
      },
      teacher: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true, avatar_url: true } },
        },
      },
      session: {
        select: {
          id: true,
          status: true,
          checkIn: true,
          checkOut: true,
          isLate: true,
        },
      },
      attendances: {
        // where: { deletedAt: null },
        select: { status: true },
      },
    },
  })
}

export async function getTeacherNextSchedule(teacherId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(orgId))
  cacheLife(CACHE.SCHEDULE.life)
  const now = new Date()
  return prisma.schedule.findFirst({
    where: { orgId, teacherId, deletedAt: null, endTime: { gt: now } },
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
      room: { select: { name: true, locationId: true } },
      class: {
        select: {
          name: true,
          level: true,
          _count: {
            select: {
              studentEnrollments: {
                where: { endedAt: null, student: { deletedAt: null } },
              },
            },
          },
        },
      },
      group: {
        select: {
          name: true,
          _count: {
            select: {
              studentGroups: {
                where: { enrollment: { endedAt: null, student: { deletedAt: null } } },
              },
            },
          },
        },
      },
      session: {
        select: { id: true, status: true, checkIn: true },
      },
    },
  })
}

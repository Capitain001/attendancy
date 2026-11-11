// src/services/session/database/session.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key';;

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
      course: { select: { id: true, name: true } },
      room:   { select: { id: true, name: true } },
      class:  { select: { name: true } },
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


// Select PARTAGÉ avec getOrgDaySchedulesWithSession — même forme de ligne,
// volontairement, pour que les helpers purs de utils.ts (classifyDaySession,
// effectiveCount, presenceStats, teacherName) s'appliquent identiquement,
// que la ligne vienne d'un scan "jour de l'org" ou d'un lookup "dernière
// séance d'un cours". Ne pas diverger cette forme sans mettre à jour les
// deux appelants + les helpers.
const courseDaySessionSelect = {
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
    select: { status: true },
  },
} as const
 

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
    select: courseDaySessionSelect,
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


// src/services/session/database/session.queries.ts — remplace ma version précédente
export const PAST_SESSIONS_PAGE_SIZE = 20

export async function getTeacherPastSessions(
  teacherId: string,
  orgId: string,
  page: number,
) {
  'use cache'
  cacheTag(CACHE.SESSION(orgId))
  cacheTag(CACHE.SESSION(orgId, teacherId))
  cacheLife(CACHE.SESSION.life)

  const rows = await prisma.session.findMany({
    where: {
      status: { in: ['COMPLETED', 'CANCELED'] },
      schedule: { orgId, teacherId, deletedAt: null },
    },
    orderBy: [{ schedule: { startTime: 'desc' } }, { id: 'desc' }],
    skip: (page - 1) * PAST_SESSIONS_PAGE_SIZE,
    take: PAST_SESSIONS_PAGE_SIZE + 1,
    select: {
      id: true,
      status: true,
      schedule: {
        select: {
          startTime: true,
          endTime: true,
          course: { select: { name: true } },
          class: { select: { name: true } },
          group: { select: { name: true } },
          room: { select: { name: true } },
          attendances: { select: { status: true } },
        },
      },
    },
  })

  return {
    sessions: rows.slice(0, PAST_SESSIONS_PAGE_SIZE),
    hasNext: rows.length > PAST_SESSIONS_PAGE_SIZE,
  }
}

export async function getSessionReport(sessionId: string, orgId: string) {
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      schedule: { orgId, deletedAt: null },
    },
    select: {
      id: true,
      status: true,
      checkIn: true,
      checkOut: true,
      durationMinutes: true,
      isLate: true,
      schedule: {
        select: {
          id: true,
          teacherId: true,
          startTime: true,
          endTime: true,
          scheduleType: true,
          status: true,
          notes: true,
          organization: {
            select: {
              name: true,
              logo: true,
            },
          },
          course: {
            select: {
              name: true,
              ueCourse: { select: { code: true } },
            },
          },
          room: {
            select: { name: true },
          },
          class: {
            select: {
              name: true,
              level: true,
            },
          },
          group: {
            select: { name: true },
          },
          teacher: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          attendances: {
            where: {
              status: { in: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] },
            },
            select: {
              id: true,
              status: true,
              recordedAt: true,
              notes: true,
              student: {
                select: {
                  id: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
            orderBy: [
              { student: { user: { lastName: 'asc' } } },
              { student: { user: { firstName: 'asc' } } },
            ],
          },
        },
      },
    },
  })

  if (!session) return null

  const { schedule } = session
  let present = 0
  let late = 0
  let absent = 0
  let excused = 0

  for (const a of schedule.attendances) {
    if (a.status === 'PRESENT') present += 1
    else if (a.status === 'LATE') late += 1
    else if (a.status === 'ABSENT') absent += 1
    else if (a.status === 'EXCUSED') excused += 1
  }

  const attended = present + late
  const total = attended + absent + excused
  const rate = total > 0 ? Math.round((attended / total) * 100) : 0

  return {
    schedule: {
      id: schedule.id,
      teacherId: schedule.teacherId,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      scheduleType: schedule.scheduleType,
      status: schedule.status,
      notes: schedule.notes,
      courseName: schedule.course.name,
      courseCode: schedule.course.ueCourse?.code ?? schedule.course.name.slice(0, 6).toUpperCase(),
      roomName: schedule.room?.name ?? null,
      className: schedule.class.name,
      classLevel: schedule.class.level,
      groupName: schedule.group?.name ?? null,
      teacher: {
        firstName: schedule.teacher.user.firstName ?? '',
        lastName: schedule.teacher.user.lastName ?? '',
        email: schedule.teacher.user.email,
      },
    },
    organization: {
      name: schedule.organization.name,
      logo: schedule.organization.logo,
    },
    session: {
      id: session.id,
      status: session.status,
      checkIn: session.checkIn,
      checkOut: session.checkOut,
      durationMinutes: session.durationMinutes,
      isLate: session.isLate,
    },
    summary: {
      total,
      attended,
      rate,
      present,
      late,
      absent,
      excused,
    },
    attendances: schedule.attendances.map((a) => ({
      id: a.id,
      status: a.status as 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED',
      recordedAt: a.recordedAt,
      notes: a.notes,
      student: {
        id: a.student.id,
        firstName: a.student.user.firstName ?? '',
        lastName: a.student.user.lastName ?? '',
        email: a.student.user.email,
      },
    })),
  }
}

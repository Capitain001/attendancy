// src/services/student/database/student.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'
import { getActiveSessions } from '@/services/session/database/session.queries'
import { getUserAttendance } from '@/services/attendance/database/attendance.queries'
import {
  ATTENDANCE_NUMERATOR_STATUSES,
  ATTENDANCE_DENOMINATOR_STATUSES,
} from '@/services/attendance/policy'
import type { AttendanceStatus } from '@/generated/prisma/client'

/** Profil étudiant courant — classId + groupIds pour filtrer les schedules. */
export async function getStudentProfile(studentId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.STUDENT(orgId, studentId))
  cacheLife(CACHE.STUDENT.life)
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { studentId, endedAt: null, class: { programTrack: { orgId } } },
    orderBy: { createdAt: 'desc' },
    select: {
      classId: true,
      student: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true, email: true, avatar_url: true } },
        },
      },
      studentGroups: {
        where: { group: { deletedAt: null } },
        select: { groupId: true },
      },
    },
  })
  if (!enrollment) return null
  return {
    studentId,
    classId:  enrollment.classId,
    groupIds: enrollment.studentGroups.map(g => g.groupId),
    user:     enrollment.student.user,
  }
}

/** Schedules de la classe filtrés pour les groupes de l'étudiant. */
export async function getStudentSchedules(
  groupIds: string[],
  params: { orgId: string; classId: string; rangeStart: Date; rangeEnd: Date },
) {
  'use cache'
  cacheTag(CACHE.SCHEDULE(params.orgId))
  cacheTag(CACHE.SCHEDULE(params.orgId, params.classId))
  cacheLife(CACHE.SCHEDULE.life)
  return prisma.schedule.findMany({
    where: {
      orgId:    params.orgId,
      classId:  params.classId,
      deletedAt: null,
      startTime: { lt: params.rangeEnd },
      endTime:   { gt: params.rangeStart },
      OR: [
        { groupId: null },
        ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
      ],
    },
    select: {
      id: true, status: true, startTime: true, endTime: true, notes: true,
      confirmed: true,
      courseId: true, teacherId: true, roomId: true, classId: true, groupId: true,
      course:  { select: { id: true, name: true } },
      room:    { select: { id: true, name: true } },
      teacher: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      group:   { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  })
}

/** Stats assiduité + notes étudiant. */
export async function getStudentStats(params: {
  studentId: string; orgId: string; classId: string; groupIds: string[];
}) {
  const now = new Date()
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const end   = new Date(now); end.setHours(23, 59, 59, 999)

  const groupOr = [
    { groupId: null },
    ...(params.groupIds.length > 0 ? [{ groupId: { in: params.groupIds } }] : []),
  ]

  const [total, present, coursesCount, todaySchedules, absencesToday, evaluations] = await Promise.all([
    prisma.attendance.count({
      where: { studentId: params.studentId, orgId: params.orgId },
    }),
    prisma.attendance.count({
      where: { studentId: params.studentId, orgId: params.orgId, status: 'PRESENT' },
    }),
    prisma.courseTeacher.count({
      where: { course: { classId: params.classId, orgId: params.orgId, deletedAt: null } },
    }),
    prisma.schedule.findMany({
      where: {
        classId: params.classId, orgId: params.orgId, deletedAt: null,
        startTime: { gte: start, lte: end },
        OR: groupOr,
      },
      select: { status: true, startTime: true, endTime: true },
    }),
    prisma.attendance.count({
      where: {
        studentId: params.studentId, orgId: params.orgId, status: 'ABSENT',
        schedule: { startTime: { gte: start, lte: end } },
      },
    }),
    prisma.evaluation.findMany({
      where: { studentId: params.studentId, orgId: params.orgId },
      select: { score: true, maxScore: true },
    }),
  ])

  let totalScore = 0
  let totalMaxScore = 0
  for (const e of evaluations) { totalScore += e.score; totalMaxScore += e.maxScore }

  // Bloc « ta journée » — CANCELED exclu (pas de séance fantôme, D22).
  const activeToday = todaySchedules.filter((s) => s.status !== 'CANCELED')
  const doneToday = activeToday.filter((s) => s.status === 'COMPLETED')
  const minutesOf = (list: typeof activeToday) =>
    Math.round(list.reduce((acc, s) => acc + (s.endTime.getTime() - s.startTime.getTime()) / 60000, 0))

  return {
    attendanceRate:   total > 0 ? Math.round((present / total) * 100) : 100,
    totalCourses:     coursesCount,
    todayCount:       todaySchedules.length,
    averageGrade:     totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100 * 100) / 100 : 0,
    totalEvaluations: evaluations.length,
    today: {
      doneSessions:  doneToday.length,
      totalSessions: activeToday.length,
      absences:      absencesToday,
      doneMinutes:   minutesOf(doneToday),
      totalMinutes:  minutesOf(activeToday),
    },
  }
}

/**
 * Séance active de l'étudiant (émargement). Non caché — temps réel.
 * Filtre groupe-sinon-classe (même règle que le planning). Compose sur session + attendance.
 */
export async function getStudentActiveSession(params: {
  studentId: string; orgId: string; classId: string; groupIds: string[];
}) {
  const { studentId, orgId, classId, groupIds } = params
  const active = await getActiveSessions(orgId)
  const groupSet = new Set(groupIds)

  const mine = active.find(
    (s) =>
      s.schedule.classId === classId &&
      (s.schedule.groupId === null || groupSet.has(s.schedule.groupId)),
  )
  if (!mine) return null

  const myAttendance = await getUserAttendance(studentId, mine.schedule.id, orgId)
  const t = mine.schedule.teacher?.user

  return {
    scheduleId: mine.schedule.id,
    course:     mine.schedule.course.name,
    room:       mine.schedule.room?.name ?? null,
    teacher:    t ? [t.firstName, t.lastName].filter(Boolean).join(' ') || null : null,
    startTime:  mine.schedule.startTime,
    endTime:    mine.schedule.endTime,
    myAttendance: myAttendance
      ? { status: myAttendance.status, recordedAt: myAttendance.recordedAt }
      : null,
  }
}

/**
 * Détail d'une séance pour le dialog planning étudiant (lecture seule).
 * Séance (scopée classe/groupe) + ma présence + taux perso sur le cours + déroulé.
 */
export async function getStudentSessionDetail(params: {
  studentId: string; scheduleId: string; orgId: string; classId: string; groupIds: string[];
}) {
  const { studentId, scheduleId, orgId, classId, groupIds } = params

  const schedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleId, orgId, classId, deletedAt: null,
      OR: [{ groupId: null }, { groupId: { in: groupIds } }],
    },
    select: {
      id: true, courseId: true, startTime: true, endTime: true, status: true,
      confirmed: true, notes: true,
      course:  { select: { name: true, credits: true } },
      room:    { select: { name: true } },
      teacher: { select: { user: { select: { firstName: true, lastName: true, avatar_url: true } } } },
      session: { select: { isLate: true, status: true, checkIn: true, checkOut: true } },
    },
  })
  if (!schedule) return null

  const [myAttendance, courseRows] = await Promise.all([
    getUserAttendance(studentId, scheduleId, orgId),
    prisma.attendance.groupBy({
      by: ['status'],
      where: { studentId, schedule: { orgId, courseId: schedule.courseId } },
      _count: { status: true },
    }),
  ])

  let numerator = 0
  let denominator = 0
  for (const row of courseRows) {
    const n = row._count.status
    if ((ATTENDANCE_NUMERATOR_STATUSES as readonly AttendanceStatus[]).includes(row.status)) numerator += n
    if ((ATTENDANCE_DENOMINATOR_STATUSES as readonly AttendanceStatus[]).includes(row.status)) denominator += n
  }
  const courseRate = denominator > 0 ? Math.round((numerator / denominator) * 100) : null

  const t = schedule.teacher?.user ?? null
  return {
    schedule: {
      id: schedule.id,
      courseName: schedule.course.name,
      credits: schedule.course.credits,
      roomName: schedule.room?.name ?? null,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: schedule.status,
      confirmed: schedule.confirmed,
      notes: schedule.notes,
      teacher: t
        ? { firstName: t.firstName, lastName: t.lastName, avatarUrl: t.avatar_url }
        : null,
    },
    myAttendance: myAttendance
      ? { status: myAttendance.status, notes: myAttendance.notes }
      : null,
    session: schedule.session,
    courseRate,
  }
}

/** Profil d'un étudiant par son ID — vue Direction (accès à n'importe quel étudiant de l'org). */
export async function getStudentByIdForDirection(studentId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.STUDENT(orgId, studentId))
  cacheLife(CACHE.STUDENT.life)
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { studentId, endedAt: null, class: { programTrack: { orgId } } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      classId: true,
      createdAt: true,
      class: { select: { id: true, name: true } },
      studentGroups: {
        where: { group: { deletedAt: null } },
        select: { group: { select: { id: true, name: true } } },
      },
      student: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true, lastName: true, email: true, avatar_url: true,
              sex: true, phone: true, dateOfBirth: true, status: true,
            },
          },
        },
      },
    },
  })
  if (!enrollment) return null
  return {
    studentId,
    classId:    enrollment.classId,
    enrolledAt: enrollment.createdAt,
    class:      enrollment.class,
    groups:     enrollment.studentGroups.map(sg => sg.group),
    user:       enrollment.student.user,
  }
}

/** Liste des parents d'une org avec leurs liens étudiants. */
export async function getParentsForDirection(orgId: string) {
  'use cache'
  cacheTag(CACHE.STUDENT(orgId))
  cacheLife(CACHE.STUDENT.life)
  return prisma.parentRelation.findMany({
    where: { orgId },
    select: {
      id: true,
      relation: true,
      parent: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true, email: true, avatar_url: true } },
        },
      },
      student: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: [
      { parent: { user: { lastName: 'asc' } } },
      { parent: { user: { firstName: 'asc' } } },
    ],
  })
}

export async function getEnrolledStudents(classId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.STUDENT(orgId, classId))
  cacheLife(CACHE.STUDENT.life)
  return prisma.studentEnrollment.findMany({
    where: {
      classId,
      endedAt: null,
      class: { programTrack: { orgId } },
      student: { deletedAt: null },
    },
    select: {
      id: true,
      studentId: true,
      studentGroups: {
        where: { group: { deletedAt: null } },
        select: {
          id: true,
          group: { select: { id: true, name: true } },
        },
      },
      createdAt: true,
      student: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true, lastName: true, email: true, avatar_url: true,
              sex: true, phone: true, dateOfBirth: true, status: true,
            },
          },
        },
      },
    },
    orderBy: [
      { student: { user: { lastName: 'asc' } } },
      { student: { user: { firstName: 'asc' } } },
    ],
  })
}

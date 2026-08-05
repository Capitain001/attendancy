// src/services/student/database/student.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

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
      course:  { select: { id: true, name: true } },
      room:    { select: { id: true, name: true } },
      teacher: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
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

  const [total, present, coursesCount, todayCount, evaluations] = await Promise.all([
    prisma.attendance.count({
      where: { studentId: params.studentId, orgId: params.orgId },
    }),
    prisma.attendance.count({
      where: { studentId: params.studentId, orgId: params.orgId, status: 'PRESENT' },
    }),
    prisma.courseTeacher.count({
      where: { course: { classId: params.classId, orgId: params.orgId, deletedAt: null } },
    }),
    prisma.schedule.count({
      where: {
        classId: params.classId, orgId: params.orgId, deletedAt: null,
        startTime: { gte: start, lte: end },
        OR: [
          { groupId: null },
          ...(params.groupIds.length > 0 ? [{ groupId: { in: params.groupIds } }] : []),
        ],
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

  return {
    attendanceRate:   total > 0 ? Math.round((present / total) * 100) : 100,
    totalCourses:     coursesCount,
    todayCount,
    averageGrade:     totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100 * 100) / 100 : 0,
    totalEvaluations: evaluations.length,
  }
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

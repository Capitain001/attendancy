import { startOfDay, endOfDay } from 'date-fns'
// import type { Prisma } from '@/generated/prisma'
import { prisma } from '@/lib/prisma'
import { activeEnrollmentWhere, activeGroupMemberWhere } from './filter'
import { Prisma } from '@/generated/prisma/client'

export async function getOrgTodayAbsences(orgId: string) {
  const now = new Date()
  return prisma.attendance.findMany({
    where: {
      status: 'ABSENT',
      schedule: {
        orgId,
        deletedAt: null,
        startTime: { gte: startOfDay(now), lte: endOfDay(now) },
      },
    },
    select: {
      id: true,
      student: {
        select: { user: { select: { firstName: true, lastName: true } } },
      },
      schedule: {
        select: {
          startTime: true,
          course: { select: { name: true } },
          class: { select: { name: true } },
          group: { select: { name: true } },
        },
      },
    },
    orderBy: { schedule: { startTime: 'asc' } },
    take: 50,
  })
}

export async function getScheduleAttendances(scheduleId: string) {
  return prisma.attendance.findMany({
    where: { scheduleId },
    select: {
      id: true,
      status: true,
      recordedAt: true,
      student: {
        select: {
          user: { select: { id: true, firstName: true, lastName: true, avatar_url: true } },
        },
      },
    },
    orderBy: { recordedAt: 'asc' },
  })
}

/**
 * Étudiants attendus à un schedule.
 * groupId présent → membres du groupe ; absent → inscrits actifs de la classe.
 */
export async function getExpectedAttendees(
  scheduleId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  const schedule = await tx.schedule.findUnique({
    where: { id: scheduleId },
    select: { classId: true, groupId: true },
  })
  if (!schedule) throw new Error('Schedule introuvable.')

  if (schedule.groupId) {
    const members = await tx.studentGroup.findMany({
      where: { groupId: schedule.groupId, ...activeGroupMemberWhere },
      select: {
        enrollment: {
          select: {
            id: true,
            studentId: true,
            student: { select: { userId: true } },
          },
        },
      },
    })
    return members.map(m => ({
      studentId:    m.enrollment.studentId,
      enrollmentId: m.enrollment.id,
      userId:       m.enrollment.student.userId,
    }))
  }

  const enrollments = await tx.studentEnrollment.findMany({
    where: { classId: schedule.classId, ...activeEnrollmentWhere },
    select: {
      id: true,
      studentId: true,
      student: { select: { userId: true } },
    },
  })
  return enrollments.map(e => ({
    studentId:    e.studentId,
    enrollmentId: e.id,
    userId:       e.student.userId,
  }))
}

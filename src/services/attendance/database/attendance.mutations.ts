import { prisma } from '@/lib/prisma'
import { getExpectedAttendees } from './attendance.queries'
import { Prisma } from '@/generated/prisma/client'

/**
 * Marque les absences d'un schedule à la clôture.
 *   1) Attendance PENDING → ABSENT
 *   2) Inscrits attendus sans ligne → ABSENT créé
 * Idempotent (skipDuplicates + @@unique).
 * `tx` propagé pour rester dans le contexte transactionnel de finalizeSession.
 */
export async function markScheduleAbsences(
  scheduleId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  const existing = await tx.attendance.findMany({
    where: { scheduleId },
    select: {
      id: true,
      status: true,
      studentId: true,
      student: { select: { userId: true } },
    },
  })

  const recordedStudentIds = new Set(existing.map(a => a.studentId))

  // (1) PENDING → ABSENT
  const pendings = existing.filter(a => a.status === 'PENDING')
  if (pendings.length > 0) {
    await tx.attendance.updateMany({
      where: { id: { in: pendings.map(p => p.id) } },
      data: { status: 'ABSENT' },
    })
  }

  // (2) Attendus sans ligne → ABSENT créé
  const [expected, sched] = await Promise.all([
    getExpectedAttendees(scheduleId, tx),
    tx.schedule.findUnique({ where: { id: scheduleId }, select: { orgId: true } }),
  ])
  const orgId = sched?.orgId ?? ''
  const absentStudents = expected.filter(e => !recordedStudentIds.has(e.studentId))

  if (absentStudents.length > 0) {
    await tx.attendance.createMany({
      data: absentStudents.map(e => ({ 
        scheduleId,
        studentId:    e.studentId,
        enrollmentId: e.enrollmentId,
        orgId,
        status:       'ABSENT' as const,
      })),
      skipDuplicates: true,
    })
  }

  const absentUserIds   = [...pendings.map(p => p.student.userId), ...absentStudents.map(e => e.userId)]
  const absentStudentIds = [...pendings.map(p => p.studentId),      ...absentStudents.map(e => e.studentId)]

  return { absentUserIds, absentStudentIds, audience: expected.length }
}

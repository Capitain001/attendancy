export * from './attendance.queries'
export * from './attendance.mutations'
export * from './filter'

import { prisma } from '@/lib/prisma'

export async function getOrgStudentAttendanceRates(orgId: string) {
  const records = await prisma.attendance.groupBy({
    by: ['studentId', 'status'],
    where: { orgId },
    _count: true,
  })

  const byStudent = new Map<string, { present: number; absent: number; late: number }>()
  for (const r of records) {
    const curr = byStudent.get(r.studentId) ?? { present: 0, absent: 0, late: 0 }
    if (r.status === 'PRESENT') curr.present += r._count
    else if (r.status === 'ABSENT') curr.absent += r._count
    else if (r.status === 'LATE') curr.late += r._count
    byStudent.set(r.studentId, curr)
  }

  const result: Record<string, { present: number; absent: number; late: number; total: number; rate: number }> = {}
  for (const [studentId, counts] of byStudent.entries()) {
    const total = counts.present + counts.absent + counts.late
    result[studentId] = {
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      total,
      rate: total > 0 ? Math.round((counts.present / total) * 100) : 100,
    }
  }
  return result
}

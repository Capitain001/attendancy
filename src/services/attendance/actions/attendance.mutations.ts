'use server'
import { ERRORS } from '@/config'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { prisma } from '@/lib/db'

export async function confirmAttendanceAction({ attendanceId }: { attendanceId: string }) {
  try {
    const user = await getUserInfo()
    if (!user) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const auth = getAuthorization(user, ['TEACHER', 'DIRECTION'])
    if (!auth.success) return { error: auth.error }

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      select: { id: true, status: true, student: { select: { userId: true } } },
    })
    if (!attendance) return { error: 'Présence introuvable.' }

    if (attendance.status === 'PRESENT') {
      return { data: { id: attendance.id, status: 'PRESENT' as const, confirmed: false } }
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { status: 'PRESENT' },
      select: { id: true, status: true },
    })
    return { data: { id: updated.id, status: updated.status, confirmed: true } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function confirmAllAttendancesAction({ scheduleId }: { scheduleId: string }) {
  try {
    const user = await getUserInfo()
    if (!user) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const auth = getAuthorization(user, ['TEACHER', 'DIRECTION'])
    if (!auth.success) return { error: auth.error }

    const pending = await prisma.attendance.findMany({
      where: { scheduleId, status: 'PENDING' },
      select: { id: true },
    })
    if (pending.length === 0) return { data: { confirmed: 0 } }

    await prisma.attendance.updateMany({
      where: { id: { in: pending.map(p => p.id) } },
      data: { status: 'PRESENT' },
    })
    return { data: { confirmed: pending.length } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

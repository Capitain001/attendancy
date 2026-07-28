import { prisma } from '@/lib/db'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateWeeklyUnavailabilityInput, CreateDateRangeUnavailabilityInput } from '../validation'

export async function createWeeklyUnavailability(
  orgId: string,
  data: Omit<CreateWeeklyUnavailabilityInput, 'teacherId'> & { teacherId: string },
) {
  const record = await tryConstraint(
    prisma.teacherUnavailability.create({
      data: {
        orgId,
        teacherId: data.teacherId,
        type:      'WEEKLY',
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime:   data.endTime,
        reason:    data.reason ?? null,
      },
      select: { id: true },
    })
  )
  invalidateEvent('TEACHER_UNAVAILABILITY_CREATED', orgId)
  return record
}

export async function createDateRangeUnavailability(
  orgId: string,
  data: Omit<CreateDateRangeUnavailabilityInput, 'teacherId'> & { teacherId: string },
) {
  const record = await tryConstraint(
    prisma.teacherUnavailability.create({
      data: {
        orgId,
        teacherId:  data.teacherId,
        type:       'DATE_RANGE',
        startDate:  data.startDate,
        endDate:    data.endDate,
        reason:     data.reason ?? null,
      },
      select: { id: true },
    })
  )
  invalidateEvent('TEACHER_UNAVAILABILITY_CREATED', orgId)
  return record
}

export async function deleteTeacherUnavailability(id: string, orgId: string) {
  await prisma.teacherUnavailability.delete({ where: { id, orgId } })
  invalidateEvent('TEACHER_UNAVAILABILITY_DELETED', orgId)
}

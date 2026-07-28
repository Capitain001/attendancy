'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { createSchedule, updateSchedule, removeSchedule } from '../database'
import { createScheduleSchema, updateScheduleSchema } from '../validation'

export async function createScheduleAction(input: unknown) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const data = v.parse(createScheduleSchema, input)

    if (new Date(data.endTime) <= new Date(data.startTime)) {
      return { error: 'L\'heure de fin doit être après l\'heure de début' }
    }

    const schedule = await createSchedule({ ...data, orgId })
    return { data: schedule }
  } catch (e) {
    if (e instanceof v.ValiError) return { error: e.issues[0]?.message ?? 'Données invalides' }
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateScheduleAction(scheduleId: string, input: unknown) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const raw = v.parse(updateScheduleSchema, input)
    const data = {
      ...raw,
      confirmed: raw.confirmed === 'true' ? true : raw.confirmed === undefined ? undefined : false,
    }

    await updateSchedule(scheduleId, orgId, data)
    return { data: { id: scheduleId } }
  } catch (e) {
    if (e instanceof v.ValiError) return { error: e.issues[0]?.message ?? 'Données invalides' }
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeScheduleAction(scheduleId: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    await removeSchedule(scheduleId, orgId)
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteScheduleAction(scheduleId: string) {
  return removeScheduleAction(scheduleId)
}

export async function restoreScheduleAction(scheduleId: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    // Re-read the schedule first (including soft-deleted)
    const { prisma } = await import('@/lib/db')
    const schedule = await prisma.schedule.findFirst({
      where: { id: scheduleId, orgId },
      include: {
        course:  { select: { id: true, name: true } },
        room:    { select: { id: true, name: true } },
        class:   { select: { id: true, name: true } },
        group:   { select: { id: true, name: true } },
        teacher: { select: { id: true, user: { select: { firstName: true, lastName: true, avatar_url: true } } } },
      },
    })
    if (!schedule) return { error: 'Séance introuvable' }

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { deletedAt: null },
    })
    const { invalidateEvent } = await import('@/cache/server/key')
    await invalidateEvent('SCHEDULE_CREATED', orgId, schedule.classId)
    return { data: schedule }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function cancelScheduleAction(scheduleId: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    await updateSchedule(scheduleId, orgId, { status: 'CANCELED' })
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { createSchedule, updateSchedule, removeSchedule, restoreSchedule } from '../database'
import { createScheduleSchema, updateScheduleSchema } from '../validation'

export async function createScheduleAction(input: unknown) {
  const user = await getUserInfo()
  const orgId = user?.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
  const auth = getAuthorization(user, 'DIRECTION')
  if (!auth.success) return { error: auth.error }

  const parsed = v.safeParse(createScheduleSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  if (new Date(parsed.output.endTime) <= new Date(parsed.output.startTime)) {
    return { error: 'L\'heure de fin doit être après l\'heure de début' }
  }

  try {
    const schedule = await createSchedule({ ...parsed.output, orgId })
    return { data: schedule }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateScheduleAction(scheduleId: string, input: unknown) {
  const user = await getUserInfo()
  const orgId = user?.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
  const auth = getAuthorization(user, 'DIRECTION')
  if (!auth.success) return { error: auth.error }

  const parsed = v.safeParse(updateScheduleSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  const data = {
    ...parsed.output,
    confirmed: parsed.output.confirmed === 'true' ? true : parsed.output.confirmed === undefined ? undefined : false,
  }

  try {
    await updateSchedule(scheduleId, orgId, data)
    return { data: { id: scheduleId } }
  } catch (e) {
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
    return { data: await restoreSchedule(scheduleId, orgId) }
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

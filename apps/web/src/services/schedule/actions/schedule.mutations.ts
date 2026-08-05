'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createSchedule, updateSchedule, removeSchedule, restoreSchedule } from '../database'
import { createScheduleSchema, updateScheduleSchema } from '../validation'

export async function createScheduleAction(input: unknown) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createScheduleSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  if (new Date(parsed.output.endTime) <= new Date(parsed.output.startTime)) {
    return { error: "L'heure de fin doit être après l'heure de début" }
  }

  try {
    const schedule = await createSchedule({ ...parsed.output, orgId })
    return { data: schedule }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateScheduleAction(scheduleId: string, input: unknown) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

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
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await removeSchedule(scheduleId, orgId)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteScheduleAction(scheduleId: string) {
  return removeScheduleAction(scheduleId)
}

export async function restoreScheduleAction(scheduleId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await restoreSchedule(scheduleId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function cancelScheduleAction(scheduleId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await updateSchedule(scheduleId, orgId, { status: 'CANCELED' })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

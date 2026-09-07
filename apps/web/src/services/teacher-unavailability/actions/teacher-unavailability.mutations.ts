'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import {
  createWeeklyUnavailabilitySchema,
  createDateRangeUnavailabilitySchema,
} from '../validation'
import type {
  CreateWeeklyUnavailabilityInput,
  CreateDateRangeUnavailabilityInput,
} from '../validation'
import {
  createWeeklyUnavailability,
  createDateRangeUnavailability,
  deleteTeacherUnavailability,
} from '../database'

export async function createWeeklyUnavailabilityAction(input: CreateWeeklyUnavailabilityInput) {
  try {
    const auth = await authAccess({ requiredRole: 'TEACHER' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const parsed = v.safeParse(createWeeklyUnavailabilitySchema, input)
    if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
    return { data: await createWeeklyUnavailability(orgId, parsed.output) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function createDateRangeUnavailabilityAction(input: CreateDateRangeUnavailabilityInput) {
  try {
    const auth = await authAccess({ requiredRole: 'TEACHER' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const parsed = v.safeParse(createDateRangeUnavailabilitySchema, input)
    if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
    return { data: await createDateRangeUnavailability(orgId, parsed.output) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteTeacherUnavailabilityAction(id: string) {
  try {
    const auth = await authAccess({ requiredRole: 'TEACHER' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    await deleteTeacherUnavailability(id, orgId)
    return { data: { id } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

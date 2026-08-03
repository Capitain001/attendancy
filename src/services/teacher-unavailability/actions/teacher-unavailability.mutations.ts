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

    const parsed = v.parse(createWeeklyUnavailabilitySchema, input)
    return { data: await createWeeklyUnavailability(orgId, parsed) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function createDateRangeUnavailabilityAction(input: CreateDateRangeUnavailabilityInput) {
  try {
    const auth = await authAccess({ requiredRole: 'TEACHER' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const parsed = v.parse(createDateRangeUnavailabilitySchema, input)
    return { data: await createDateRangeUnavailability(orgId, parsed) }
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
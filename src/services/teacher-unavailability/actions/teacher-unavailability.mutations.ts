'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
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
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'TEACHER')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(createWeeklyUnavailabilitySchema, input)
    return { data: await createWeeklyUnavailability(orgId, parsed) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function createDateRangeUnavailabilityAction(input: CreateDateRangeUnavailabilityInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'TEACHER')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(createDateRangeUnavailabilitySchema, input)
    return { data: await createDateRangeUnavailability(orgId, parsed) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteTeacherUnavailabilityAction(id: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'TEACHER')
    if (!auth.success) return { error: auth.error }

    await deleteTeacherUnavailability(id, orgId)
    return { data: { id } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

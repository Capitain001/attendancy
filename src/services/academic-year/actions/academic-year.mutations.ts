'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { createAcademicYearSchema, setCurrentYearSchema } from '../validation'
import type { CreateAcademicYearInput, SetCurrentYearInput } from '../validation'
import { createAcademicYear, setCurrentYear, removeAcademicYear, updateAcademicYear } from '../database'
import type { UpdateAcademicYearData } from '../database'

export async function createAcademicYearAction(input: CreateAcademicYearInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(createAcademicYearSchema, input)
    if (parsed.startDate >= parsed.endDate)
      return { error: 'La date de début doit être antérieure à la date de fin' }

    return { data: await createAcademicYear({ ...parsed, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function setCurrentYearAction(input: SetCurrentYearInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(setCurrentYearSchema, input)
    return { data: await setCurrentYear(parsed.academicYearId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateAcademicYearAction(academicYearId: string, data: UpdateAcademicYearData) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    return { data: await updateAcademicYear(academicYearId, orgId, data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeAcademicYearAction(academicYearId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    return { data: await removeAcademicYear(academicYearId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export { createAcademicYearAction as createYearAction }
export { removeAcademicYearAction as deleteYearAction }
export { updateAcademicYearAction as updateYearAction }

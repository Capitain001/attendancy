'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getAcademicYears, getCurrentYear } from '../database'

export async function getAcademicYearsAction() {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data
    return { data: await getAcademicYears(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getCurrentYearAction() {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data
    return { data: await getCurrentYear(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

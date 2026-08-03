'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getUECoursesByUE } from '../database'

export async function getUECoursesAction(ueId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getUECoursesByUE(ueId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
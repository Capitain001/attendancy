'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getTeacherUnavailabilities } from '../database'

export async function getTeacherUnavailabilitiesAction(teacherId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getTeacherUnavailabilities(teacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

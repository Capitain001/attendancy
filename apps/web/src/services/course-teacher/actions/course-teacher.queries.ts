'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getCourseTeachers, getCourseTeachersIds } from '../database'

export async function getCourseTeachersAction(courseId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getCourseTeachers(courseId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getCourseTeachersIdAction(courseId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getCourseTeachersIds(courseId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

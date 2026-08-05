'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getClasses, getClass } from '../database'

export async function getClassesAction(yearId?: string) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data
    return { data: await getClasses(orgId, yearId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getClassAction(classId: string) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data
    return { data: await getClass(classId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

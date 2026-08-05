'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getGroupsByClass } from '../database'

export async function getGroupsByClassAction(classId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getGroupsByClass(classId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

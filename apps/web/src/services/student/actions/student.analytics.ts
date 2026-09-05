"use server"
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getStudentsStats } from '../database'

export async function getStudentsStatsAction(classId?: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getStudentsStats(orgId, classId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

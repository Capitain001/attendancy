
'use server'
import { ERRORS } from '@/config'
import { authAccess } from '@/services/auth'
import { getTeacherStats, getOrganizationTeacherStats } from '../database/teacher.analytics'

export async function getTeacherStatsAction(teacherId: string) {
  const auth = await authAccess({ requiredRole: ['DIRECTION', 'ADMIN', 'TEACHER'] })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getTeacherStats(teacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getOrganizationTeacherStatsAction() {
  const auth = await authAccess({ requiredRole: ['DIRECTION', 'ADMIN'] })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getOrganizationTeacherStats(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

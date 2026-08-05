'use server'

import { authAccess } from '@/modules/auth'
import { ERRORS } from '@/config'
import { getOrgPlanningResources, getPlanningResources } from './database'

export async function getPlanningResourcesAction(classId: string) {
  const auth = await authAccess({ requiredRole: ['ADMIN', 'TEACHER', 'DIRECTION'] })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const resources = await getPlanningResources(classId, orgId)
    if (!resources) return { error: 'Classe introuvable' }
    return { data: resources }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getOrgPlanningResourcesAction() {
  const auth = await authAccess({ requiredRole: ['ADMIN', 'DIRECTION'] })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const data = await getOrgPlanningResources(orgId)
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

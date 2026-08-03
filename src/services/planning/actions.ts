'use server'

import { getUserInfo } from '@/modules/user'
import { getAuthorization } from '@/modules/auth'
import { ERRORS } from '@/config'
import { getOrgPlanningResources } from './database'

export async function getOrgPlanningResourcesAction() {
  try {
    const user = await getUserInfo()
    if (!user) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const auth = getAuthorization(user, ['ADMIN', 'DIRECTION'])
    if (!auth.success) return { error: auth.error }

    const data = await getOrgPlanningResources(orgId)
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

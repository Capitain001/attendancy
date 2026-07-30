'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { getUserRoleStats } from './database'
import type { UserRoleStats } from './stats'

export async function getUserRoleStatsAction(): Promise<{ data: UserRoleStats } | { error: string }> {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getUserRoleStats(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

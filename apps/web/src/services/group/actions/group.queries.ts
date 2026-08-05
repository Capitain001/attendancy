'use server'
import { getUserInfo } from '@/modules/user'
import { ERRORS } from '@/config'
import { getGroupsByClass } from '../database'

export async function getGroupsByClassAction(classId: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getGroupsByClass(classId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

'use server'
import { getUserInfo } from '@/modules/user'
import { ERRORS } from '@/config'
import { getTeacherUnavailabilities } from '../database'

export async function getTeacherUnavailabilitiesAction(teacherId: string) {

    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
   
     try {
    return { data: await getTeacherUnavailabilities(teacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

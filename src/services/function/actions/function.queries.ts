'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { getFunctions, getFunctionByName } from '../database'

export async function getFunctionsAction() {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getFunctions(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getFunctionAction(name: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const data = await getFunctionByName(name, orgId)
    if (!data) return { error: 'Fonction introuvable' }
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

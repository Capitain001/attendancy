'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { getUEs, getProgramUEs } from '../database'
import { getProgramUEsTable } from '../utils'

export async function getUEsAction(departmentId?: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getUEs(orgId, departmentId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getProgramUEsAction({ programId }: { programId: string }) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getProgramUEs(programId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getProgramUEsTableAction({ programId }: { programId: string }) {
  try {
    const result = await getProgramUEsAction({ programId })
    if ('error' in result) return result
    return { data: getProgramUEsTable(result.data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

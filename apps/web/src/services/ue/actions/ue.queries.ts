'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getUEs, getProgramUEs, getUEById } from '../database'
import { getProgramUEsTable } from '../utils'

export async function getUEsAction(departmentId?: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getUEs(orgId, departmentId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getProgramUEsAction({ programId }: { programId: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getProgramUEs(programId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getProgramUEsTableAction({ programId }: { programId: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const result = await getProgramUEs(programId, orgId)
    return { data: getProgramUEsTable(result) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getUEByIdAction({ ueId }: { ueId: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getUEById(ueId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
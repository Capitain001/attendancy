'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getReferentials, getUETemplates, getUETemplateImportsByOrg } from '../database'
import type { GetUETemplatesParams } from '../database'

export async function getReferentialsAction() {
  const auth = await authAccess() //pas necessaire car donner public
  if (!auth.data) return { error: auth.error }

  try {
    return { data: await getReferentials() }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getUETemplatesAction(params: GetUETemplatesParams) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }

  try {
    return { data: await getUETemplates(params) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getUETemplateImportsByOrgAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getUETemplateImportsByOrg(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

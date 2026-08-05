'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getWeeklyTemplates, getWeeklyTemplate } from '../database'

export async function getWeeklyTemplatesAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const data = await getWeeklyTemplates(orgId)
    return { data }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function getWeeklyTemplateAction(id: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const data = await getWeeklyTemplate(id, orgId)
    if (!data) return { error: 'Template introuvable' }
    return { data }
  } catch {
    return { error: ERRORS.SERVER }
  }
}
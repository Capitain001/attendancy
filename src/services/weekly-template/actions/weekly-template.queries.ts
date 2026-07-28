'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { getWeeklyTemplates, getWeeklyTemplate } from '../database'

export async function getWeeklyTemplatesAction() {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

  try {
    const data = await getWeeklyTemplates(orgId)
    return { data }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function getWeeklyTemplateAction(id: string) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

  try {
    const data = await getWeeklyTemplate(id, orgId)
    if (!data) return { error: 'Template introuvable' }
    return { data }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

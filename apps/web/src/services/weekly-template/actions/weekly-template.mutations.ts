'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/modules/user'
import { getAuthorization } from '@/modules/auth'
import { ERRORS } from '@/config'
import {
  createWeeklyTemplate,
  updateWeeklyTemplate,
  removeWeeklyTemplate,
  createWeeklySlot,
  removeWeeklySlot,
  applyWeeklyTemplate,
} from '../database'
import {
  createWeeklyTemplateSchema,
  updateWeeklyTemplateSchema,
  createWeeklySlotSchema,
  applyTemplateSchema,
} from '../validation'

export async function createWeeklyTemplateAction(input: unknown) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

  const auth = getAuthorization(user, 'DIRECTION')
  if (!auth.success) return { error: auth.error }

  const result = v.safeParse(createWeeklyTemplateSchema, input)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    const data = await createWeeklyTemplate(orgId, result.output.name)
    return { data }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function updateWeeklyTemplateAction(id: string, input: unknown) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

  const auth = getAuthorization(user, 'DIRECTION')
  if (!auth.success) return { error: auth.error }

  const result = v.safeParse(updateWeeklyTemplateSchema, input)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    const data = await updateWeeklyTemplate(id, orgId, result.output)
    return { data }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function removeWeeklyTemplateAction(id: string) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

  const auth = getAuthorization(user, 'DIRECTION')
  if (!auth.success) return { error: auth.error }

  try {
    await removeWeeklyTemplate(id, orgId)
    return { data: { id } }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function addWeeklySlotAction(templateId: string, input: unknown) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

  const auth = getAuthorization(user, 'DIRECTION')
  if (!auth.success) return { error: auth.error }

  const result = v.safeParse(createWeeklySlotSchema, input)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    const data = await createWeeklySlot(templateId, orgId, result.output)
    return { data }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function removeWeeklySlotAction(slotId: string) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

  const auth = getAuthorization(user, 'DIRECTION')
  if (!auth.success) return { error: auth.error }

  try {
    await removeWeeklySlot(slotId, orgId)
    return { data: { slotId } }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function applyWeeklyTemplateAction(input: unknown) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

  const auth = getAuthorization(user, 'DIRECTION')
  if (!auth.success) return { error: auth.error }

  const result = v.safeParse(applyTemplateSchema, input)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    const data = await applyWeeklyTemplate({ ...result.output, orgId })
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

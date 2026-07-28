'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import {
  createWeeklyTemplate,
  updateWeeklyTemplate,
  deleteWeeklyTemplate,
  createWeeklySlot,
  deleteWeeklySlot,
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

  let parsed
  try { parsed = v.parse(createWeeklyTemplateSchema, input) }
  catch (e) {
    const msg = e instanceof v.ValiError ? e.issues[0]?.message : 'Données invalides'
    return { error: msg ?? 'Données invalides' }
  }

  try {
    const data = await createWeeklyTemplate(orgId, parsed.name)
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

  let parsed
  try { parsed = v.parse(updateWeeklyTemplateSchema, input) }
  catch (e) {
    const msg = e instanceof v.ValiError ? e.issues[0]?.message : 'Données invalides'
    return { error: msg ?? 'Données invalides' }
  }

  try {
    const data = await updateWeeklyTemplate(id, orgId, parsed)
    return { data }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function deleteWeeklyTemplateAction(id: string) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

  const auth = getAuthorization(user, 'DIRECTION')
  if (!auth.success) return { error: auth.error }

  try {
    await deleteWeeklyTemplate(id, orgId)
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

  let parsed
  try { parsed = v.parse(createWeeklySlotSchema, input) }
  catch (e) {
    const msg = e instanceof v.ValiError ? e.issues[0]?.message : 'Données invalides'
    return { error: msg ?? 'Données invalides' }
  }

  try {
    const data = await createWeeklySlot(templateId, orgId, parsed)
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
    await deleteWeeklySlot(slotId, orgId)
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

  let parsed
  try { parsed = v.parse(applyTemplateSchema, input) }
  catch (e) {
    const msg = e instanceof v.ValiError ? e.issues[0]?.message : 'Données invalides'
    return { error: msg ?? 'Données invalides' }
  }

  try {
    const data = await applyWeeklyTemplate({ ...parsed, orgId })
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

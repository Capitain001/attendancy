'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
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
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const result = v.safeParse(createWeeklyTemplateSchema, input)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await createWeeklyTemplate(orgId, result.output.name) }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function updateWeeklyTemplateAction(id: string, input: unknown) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const result = v.safeParse(updateWeeklyTemplateSchema, input)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await updateWeeklyTemplate(id, orgId, result.output) }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function removeWeeklyTemplateAction(id: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await removeWeeklyTemplate(id, orgId)
    return { data: { id } }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function addWeeklySlotAction(templateId: string, input: unknown) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const result = v.safeParse(createWeeklySlotSchema, input)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await createWeeklySlot(templateId, orgId, result.output) }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function removeWeeklySlotAction(slotId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await removeWeeklySlot(slotId, orgId)
    return { data: { slotId } }
  } catch {
    return { error: ERRORS.SERVER }
  }
}

export async function applyWeeklyTemplateAction(input: unknown) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const result = v.safeParse(applyTemplateSchema, input)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await applyWeeklyTemplate({ ...result.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

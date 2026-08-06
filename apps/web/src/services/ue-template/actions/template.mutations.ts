'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { ImportUETemplateSchema, ImportMentionSchema } from '../validation'
import type { ImportUETemplateInput, ImportMentionInput } from '../validation'
import { importUEFromTemplate, importMentionFromReferential, deleteImportedUE } from '../database'

export async function importUEFromTemplateAction(input: ImportUETemplateInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(ImportUETemplateSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const result = await importUEFromTemplate({ ...parsed.output, orgId })
    return { data: result }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function importMentionFromReferentialAction(input: ImportMentionInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(ImportMentionSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const result = await importMentionFromReferential({ ...parsed.output, orgId })
    return { data: result }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteUETemplateImportAction({ ueId }: { ueId: string }) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await deleteImportedUE(ueId, orgId)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import * as v from 'valibot'
import { ApplyProgramsInput, ApplyProgramsSchema } from '../validation'
import { applyProgramTemplate } from '../database/import.mutations'

export async function applyProgramsAction(input: ApplyProgramsInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(ApplyProgramsSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    for (const programTemplateId of parsed.output.programTemplateIds) {
      await applyProgramTemplate(orgId, programTemplateId)
    }
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

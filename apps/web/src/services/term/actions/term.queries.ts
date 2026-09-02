'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { classIdSchema, termIdSchema } from '../validation'
import { getTerms, getTerm } from '../database'

export async function getTermsAction(classId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(classIdSchema, classId)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'ID invalide' }

  try {
    return { data: await getTerms(parsed.output, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTermAction(termId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(termIdSchema, termId)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'ID invalide' }

  try {
    const term = await getTerm(parsed.output, orgId)
    if (!term) return { error: ERRORS.DB.NOT_FOUND }
    return { data: term }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

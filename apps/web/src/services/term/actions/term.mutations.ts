'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import {
  createTermSchema,
  updateTermSchema,
  termIdSchema,
  classIdSchema,
} from '../validation'
import type { CreateTermInput, UpdateTermInput } from '../validation'
import { createTerm, updateTerm, removeTerm, generateTermsFromProgram } from '../database'

export async function createTermAction(input: CreateTermInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createTermSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await createTerm(parsed.output, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateTermAction(input: UpdateTermInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(updateTermSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await updateTerm(parsed.output.termId, orgId, parsed.output.data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// DELETE toujours audité (service-module-pattern §Audit log) — brancher
// logAuditAsync({ userId: auth.data.user.id, action: 'DELETE', resource: 'TERM',
// resourceId: termId, orgId }) après le retour de removeTerm, avant le
// `return { data }`, une fois le helper d'audit du projet importé ici.
export async function removeTermAction(termId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(termIdSchema, termId)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'ID invalide' }

  try {
    return { data: await removeTerm(parsed.output, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function generateTermsFromProgramAction(classId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(classIdSchema, classId)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'ID invalide' }

  try {
    return { data: await generateTermsFromProgram(parsed.output, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

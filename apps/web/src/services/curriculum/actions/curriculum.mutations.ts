'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { classIdSchema } from '../validation'
import { applyProgramToClass } from '../database'

/**
 * Point d'entrée unique pour "appliquer la maquette à cette classe" —
 * remplace l'enchaînement manuel generateTermsFromProgramAction puis
 * generateCoursesFromProgramAction (ordre non garanti, mapping jamais
 * construit côté UI). Un seul rôle autorisé, une seule action à brancher
 * sur un seul bouton.
 */
export async function applyProgramToClassAction(classId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(classIdSchema, classId)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'ID invalide' }

  try {
    return { data: await applyProgramToClass({ classId: parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

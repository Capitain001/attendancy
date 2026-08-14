'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createClassSchema, updateClassSchema } from '../validation'
import type { CreateClassInput, UpdateClassInput, UpdateClassOutput } from '../validation'
import { createClass, removeClass, updateClass } from '../database'

export async function createClassAction(input: CreateClassInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createClassSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await createClass({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateClassAction(input: UpdateClassInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
 
  const { orgId } = auth.data
 
  // Valide classId ET data en un seul passage — classId n'est plus un
  // simple `string` non vérifié : il passe par uuid() comme functionId,
  // grâce à validateWithId. `input` est déjà typé via UpdateClassInput
  // (InferInput du schéma), donc le compilateur attrape une forme
  // incorrecte AVANT le runtime — safeParse reste le filet de sécurité
  // final (ne jamais faire confiance à ce qui traverse la frontière
  // client/serveur, même typé).
  const parsed = v.safeParse(updateClassSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
 
  try {
    return { data: await updateClass(parsed.output.classId, orgId, parsed.output.data) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}
 

export async function removeClassAction(classId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await removeClass(classId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

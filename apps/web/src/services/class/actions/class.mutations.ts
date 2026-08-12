'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createClassSchema, updateClassSchema } from '../validation'
import type { CreateClassInput, UpdateClassOutput } from '../validation'
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

export async function updateClassAction({ classId, data }: { classId: string; data: UpdateClassOutput }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }

  const { orgId } = auth.data
  const parsed = v.safeParse(updateClassSchema, data)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await updateClass(classId, orgId, parsed.output) }
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

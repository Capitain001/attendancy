'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { createPersonalClass, updatePersonalClass } from '../database'
import { createPersonalClassSchema, updatePersonalClassSchema } from '../validation'
import type { CreatePersonalClassInput, UpdatePersonalClassInput } from '../validation'

export async function createPersonalClassAction(input: CreatePersonalClassInput) {
  const auth = await authAccess({ requiredRole: 'TEACHER', requiredOrgType: 'PERSONAL' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createPersonalClassSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  const class_ = await createPersonalClass({ ...parsed.output, orgId })
  return { data: class_ }
}

export async function updatePersonalClassAction(input: UpdatePersonalClassInput) {
  const auth = await authAccess({ requiredRole: 'TEACHER', requiredOrgType: 'PERSONAL' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(updatePersonalClassSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  const class_ = await updatePersonalClass(parsed.output.classId, orgId, parsed.output.data)
  return { data: class_ }
}
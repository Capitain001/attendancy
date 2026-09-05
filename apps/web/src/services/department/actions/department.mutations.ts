'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createDepartmentSchema, updateDepartmentSchema } from '../validation'
import type { CreateDepartmentInput, UpdateDepartmentInput } from '../validation'
import { createDepartment, updateDepartment, deleteDepartment } from '../database'

export async function createDepartmentAction(input: CreateDepartmentInput) {
  // 1. Validation (hors try/catch) - safeParse
  const parsed = v.safeParse(createDepartmentSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  }

  // 2. Auth
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  // 3. Requête database (dans try/catch)
  try {
    return { data: await createDepartment({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateDepartmentAction(input: UpdateDepartmentInput) {
  // 1. Validation (hors try/catch) - safeParse
  const parsed = v.safeParse(updateDepartmentSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  }

  // 2. Auth
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  // 3. Requête database (dans try/catch)
  try {
    return { data: await updateDepartment(parsed.output.departmentId, orgId, parsed.output.data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteDepartmentAction(departmentId: string) {
  // 1. Auth (pas de validation pour un ID simple)
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  // 2. Requête database (dans try/catch)
  try {
    return { data: await deleteDepartment(departmentId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

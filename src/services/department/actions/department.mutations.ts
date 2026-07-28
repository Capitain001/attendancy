'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { createDepartmentSchema, updateDepartmentSchema } from '../validation'
import type { CreateDepartmentInput, UpdateDepartmentInput } from '../validation'
import { createDepartment, updateDepartment, deleteDepartment } from '../database'

export async function createDepartmentAction(input: CreateDepartmentInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(createDepartmentSchema, input)
    return { data: await createDepartment({ ...parsed, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateDepartmentAction(input: UpdateDepartmentInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(updateDepartmentSchema, input)
    return { data: await updateDepartment({ ...parsed, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteDepartmentAction(departmentId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    return { data: await deleteDepartment(departmentId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export const addDepartmentAction = createDepartmentAction

export async function removeDepartmentAction(departmentId: string): Promise<{ success: boolean; error?: string }> {
  const result = await deleteDepartmentAction(departmentId)
  if ('error' in result) return { success: false, error: result.error }
  return { success: true }
}

export async function updateDepartmentByIdAction(
  departmentId: string,
  data: { name: string },
): ReturnType<typeof updateDepartmentAction> {
  return updateDepartmentAction({ departmentId, name: data.name })
}

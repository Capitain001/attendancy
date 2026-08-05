'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import {
  assignFunctionsToMember,
  revokeFunctionsFromMember,
  updateMemberFunctions,
  removeDirectionMember,
} from '../database'
import type { AssignFunctionsParams } from '../types'

export async function assignFunctionsToMemberAction(params: AssignFunctionsParams) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  try {
    await assignFunctionsToMember({ ...params, orgId, assignedBy: user.id })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function revokeFunctionsFromMemberAction(userId: string, functionIds: string[]) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await revokeFunctionsFromMember({ userId, orgId, functionIds })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateMemberFunctionsAction(params: AssignFunctionsParams) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  try {
    await updateMemberFunctions({ ...params, orgId, assignedBy: user.id })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteDirectionMemberAction(directionId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await removeDirectionMember(directionId, orgId)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

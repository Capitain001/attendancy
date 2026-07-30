'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import {
  assignFunctionsToMember,
  revokeFunctionsFromMember,
  updateMemberFunctions,
  removeDirectionMember,
} from '../database'
import type { AssignFunctionsParams } from '../types'

export async function assignFunctionsToMemberAction(
  params: AssignFunctionsParams
): Promise<{ data: true } | { error: string }> {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    await assignFunctionsToMember({ ...params, orgId, assignedBy: user.id })
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function revokeFunctionsFromMemberAction(
  userId: string,
  functionIds: string[]
): Promise<{ data: true } | { error: string }> {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    await revokeFunctionsFromMember({ userId, orgId, functionIds })
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateMemberFunctionsAction(
  params: AssignFunctionsParams
): Promise<{ data: true } | { error: string }> {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    await updateMemberFunctions({ ...params, orgId, assignedBy: user.id })
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteDirectionMemberAction(
  directionId: string
): Promise<{ data: true } | { error: string }> {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    await removeDirectionMember(directionId, orgId)
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

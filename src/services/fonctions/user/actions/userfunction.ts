'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { getUserFunctions, getUsersByFunction, assignFunction, unassignFunction } from '../database'
import type { AssignFunctionInput } from '../validation'

export async function assignFunctionAction(input: AssignFunctionInput) {
  const user = await getUserInfo()
  if (!user?.id) return { success: false as const, error: ERRORS.AUTH.UNAUTHORIZED }
  try {
    await assignFunction(input.userId, input.functionId, user.id)
    return { success: true as const }
  } catch (e) {
    return { success: false as const, error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeFunctionAction(input: AssignFunctionInput) {
  const user = await getUserInfo()
  if (!user?.id) return { success: false as const, error: ERRORS.AUTH.UNAUTHORIZED }
  try {
    await unassignFunction(input.userId, input.functionId)
    return { success: true as const }
  } catch (e) {
    return { success: false as const, error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getUserFunctionsAction(userId: string) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  try {
    return { data: await getUserFunctions(userId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getUsersByFunctionAction(functionId: string) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  try {
    return { data: await getUsersByFunction(functionId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

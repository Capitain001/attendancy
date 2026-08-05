'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/modules/user'
import { getAuthorization } from '@/modules/auth'
import { ERRORS } from '@/config'
import { createFunctionSchema, updateFunctionSchema } from '../validation'
import type { CreateFunctionInput, UpdateFunctionInput } from '../validation'
import {
  createFunction,
  updateFunction,
  deleteFunction,
  assignFunctionToUser,
  removeFunctionFromUser,
} from '../database'
import { getFunctionByName } from '../database'

export async function createFunctionAction(input: CreateFunctionInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }
    const parsed = v.parse(createFunctionSchema, input)
    return { data: await createFunction({ ...parsed, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateFunctionAction(input: UpdateFunctionInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }
    const parsed = v.parse(updateFunctionSchema, input)
    return { data: await updateFunction({ ...parsed, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteFunctionAction(functionId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }
    await deleteFunction(functionId, orgId)
    return { data: { id: functionId } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function assignFunctionToUserAction(params: {
  userId: string
  functionName: string
}) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }
    const fn = await getFunctionByName(params.functionName, orgId)
    if (!fn) return { error: `Fonction "${params.functionName}" introuvable` }
    return { data: await assignFunctionToUser({ userId: params.userId, functionId: fn.id, orgId, assignedBy: user.id }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeFunctionFromUserAction(params: {
  userId: string
  functionId: string
}) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }
    await removeFunctionFromUser({ userId: params.userId, functionId: params.functionId, orgId })
    return { data: { userId: params.userId, functionId: params.functionId } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

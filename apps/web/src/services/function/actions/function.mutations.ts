//src/
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createFunctionSchema, revokeFunctionFromUserSchema, updateFunctionSchema } from '../validation'
import type { CreateFunctionInput, RevokeFunctionFromUserInput, UpdateFunctionInput } from '../validation'
import {
  createFunction,
  updateFunction,
  deleteFunction,
  assignFunctionToUser,
  deleteFunctionFromUser,
  getFunctionByName,
  createMainFunctions,
  removeFunctionFromUser
} from '../database'
import { logAuditAsync } from '@/utils/server'


 
export async function createMainFunctionsAction() {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data
 
  const functions = await createMainFunctions(orgId)
  return { data: functions }
}
 

export async function createFunctionAction(input: CreateFunctionInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createFunctionSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await createFunction({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateFunctionAction(input: UpdateFunctionInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(updateFunctionSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await updateFunction(parsed.output.functionId, orgId, parsed.output.data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteFunctionAction(functionId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
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
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  try {
    const fn = await getFunctionByName(params.functionName, orgId)
    if (!fn) return { error: `Fonction "${params.functionName}" introuvable` }
    return { data: await assignFunctionToUser({ userId: params.userId, functionId: fn.id, orgId, assignedBy: user.id }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteFunctionFromUserAction(params: {
  userId: string
  functionId: string
}) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await deleteFunctionFromUser({ userId: params.userId, functionId: params.functionId, orgId })
    return { data: { userId: params.userId, functionId: params.functionId } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}


export async function removeFunctionFromUserAction(input: RevokeFunctionFromUserInput) {
  const auth = await authAccess({ requiredRole: 'ADMIN' })
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  const parsed = v.safeParse(revokeFunctionFromUserSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    await removeFunctionFromUser({ ...parsed.output, orgId })
    // Fire-and-forget, après la mutation —
    logAuditAsync({ userId: user.id, orgId, action: 'DELETE', resource: 'FUNCTION', resourceId: parsed.output.functionId, details: { targetUserId: parsed.output.userId } })
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
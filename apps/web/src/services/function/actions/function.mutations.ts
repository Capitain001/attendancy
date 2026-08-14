//src/
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createFunctionSchema, updateFunctionSchema } from '../validation'
import type { CreateFunctionInput, UpdateFunctionInput } from '../validation'
import {
  createFunction,
  updateFunction,
  deleteFunction,
  assignFunctionToUser,
  removeFunctionFromUser,
  getFunctionByName,
} from '../database'

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

export async function removeFunctionFromUserAction(params: {
  userId: string
  functionId: string
}) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await removeFunctionFromUser({ userId: params.userId, functionId: params.functionId, orgId })
    return { data: { userId: params.userId, functionId: params.functionId } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

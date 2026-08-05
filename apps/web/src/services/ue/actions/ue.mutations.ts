'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createUESchema, linkUESchema } from '../validation'
import type { CreateUEInput, ReorderProgramPayload } from '../validation'
import type { UpdateUEData } from '../database'
import { createUE, removeUE, updateUE, reorderProgram, addUEToProgram } from '../database'

export async function createUEAction(input: {
  data: CreateUEInput
  programId?: string
  semester?: number
  order?: number
}) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const result = v.safeParse(createUESchema, input.data)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    const ue = await createUE({ ...result.output, orgId })
    if (input.programId) {
      await addUEToProgram({
        programId: input.programId,
        ueId:      ue.id,
        semester:  input.semester ?? 1,
      })
    }
    return { data: ue }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function archiveUEAction(ueId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await removeUE(ueId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateUEAction({ ueId, data }: { ueId: string; data: UpdateUEData }) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await updateUE(ueId, orgId, data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function addUEToProgramAction(input: {
  ueId: string
  programId: string
  semester?: number
  order?: number
}) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const result = v.safeParse(linkUESchema, input)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await addUEToProgram({
      programId: result.output.programId,
      ueId:      result.output.ueId,
      semester:  result.output.semester ?? 1,
    }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function reorderProgramAction({ programId, ueOrders, courseOrders }: ReorderProgramPayload) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await reorderProgram(programId, orgId, ueOrders, courseOrders)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

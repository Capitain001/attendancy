'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { createUESchema, linkUESchema } from '../validation'
import type { CreateUEInput, ReorderProgramPayload } from '../validation'
import type { UpdateUEData } from '../database'
import { createUE, removeUE, updateUE, reorderProgram } from '../database'
import { addUEToProgram } from '@/services/program-track/database'

export async function createUEAction(input: {
  data: CreateUEInput
  programId?: string
  semester?: number
  order?: number
}) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
  const auth = getAuthorization(user, 'DIRECTION')
  if (!auth.success) return { error: auth.error }

  const result = v.safeParse(createUESchema, input.data)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    const ue = await createUE({ ...result.output, orgId })
    if (input.programId) {
      await addUEToProgram({
        programId: input.programId,
        ueId:      ue.id,
        semester:  input.semester ?? 1,
        orgId,
      })
    }
    return { data: ue }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function archiveUEAction(ueId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    return { data: await removeUE(ueId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateUEAction({ ueId, data }: { ueId: string; data: UpdateUEData }) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

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
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
  const auth = getAuthorization(user, 'DIRECTION')
  if (!auth.success) return { error: auth.error }

  const result = v.safeParse(linkUESchema, input)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    const data = await addUEToProgram({
      programId: result.output.programId,
      ueId:      result.output.ueId,
      semester:  result.output.semester ?? 1,
      orgId,
    })
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function reorderProgramAction({ programId, ueOrders, courseOrders }: ReorderProgramPayload) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    await reorderProgram(programId, orgId, ueOrders, courseOrders)
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

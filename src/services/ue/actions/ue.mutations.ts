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
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(createUESchema, input.data)
    const ue = await createUE({ ...parsed, orgId })

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
    if (e instanceof v.ValiError) return { error: e.issues[0]?.message ?? 'Données invalides' }
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
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(linkUESchema, input)
    const result = await addUEToProgram({
      programId: parsed.programId,
      ueId:      parsed.ueId,
      semester:  parsed.semester ?? 1,
      orgId,
    })
    return { data: result }
  } catch (e) {
    if (e instanceof v.ValiError) return { error: e.issues[0]?.message ?? 'Données invalides' }
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

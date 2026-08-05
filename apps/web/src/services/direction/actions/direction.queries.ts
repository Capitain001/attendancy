'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import {
  getDirectionMembers,
  getDirectionMember,
  getDirectionMemberByUserId,
} from '../database'
import type { GetDirectionMembersDto } from '../types'

export async function getDirectionMembersAction(params?: { functionId?: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getDirectionMembers(orgId, params?.functionId) as GetDirectionMembersDto }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getDirectionMemberAction(directionId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const data = await getDirectionMember(directionId, orgId)
    if (!data) return { error: 'Membre introuvable' }
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getDirectionMemberByUserIdAction(userId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const data = await getDirectionMemberByUserId(userId, orgId)
    if (!data) return { error: 'Membre introuvable' }
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

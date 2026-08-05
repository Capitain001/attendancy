'use server'
import { getUserInfo } from '@/modules/user'
import { ERRORS } from '@/config'
import {
  getDirectionMembers,
  getDirectionMember,
  getDirectionMemberByUserId,
} from '../database'
import type { GetDirectionMembersDto } from '../types'

export async function getDirectionMembersAction(params?: {
  functionId?: string
}): Promise<{ data: GetDirectionMembersDto } | { error: string }> {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getDirectionMembers(orgId, params?.functionId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getDirectionMemberAction(
  directionId: string
): Promise<{ data: NonNullable<Awaited<ReturnType<typeof getDirectionMember>>> } | { error: string }> {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const data = await getDirectionMember(directionId, orgId)
    if (!data) return { error: 'Membre introuvable' }
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getDirectionMemberByUserIdAction(
  userId: string
): Promise<{ data: NonNullable<Awaited<ReturnType<typeof getDirectionMemberByUserId>>> } | { error: string }> {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const data = await getDirectionMemberByUserId(userId, orgId)
    if (!data) return { error: 'Membre introuvable' }
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

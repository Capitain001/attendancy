'use server'
import * as v from 'valibot'
import { Role } from '@/generated/prisma'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { getUserProfile, getUsersByRoles, getFunctionProfiles } from '../database'
import { userIdSchema, rolesSchema, functionIdSchema } from './validation'
import type { FunctionProfile, UserProfile, UserProfileList } from './types'

export async function getUserProfileAction(
  userId: string
): Promise<{ data: UserProfile } | { error: string }> {
  try {
    const parsed = v.parse(userIdSchema, { userId })
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const profile = await getUserProfile(parsed.userId, orgId)
    if (!profile) return { error: 'Profil utilisateur introuvable' }
    return { data: profile }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getUsersByRolesAction(
  roles: Role[]
): Promise<{ data: UserProfileList } | { error: string }> {
  try {
    const parsed = v.parse(rolesSchema, { roles })
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getUsersByRoles(parsed.roles, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getFunctionProfilesAction(
  functionId: string
): Promise<{ data: FunctionProfile[] } | { error: string }> {
  try {
    const parsed = v.parse(functionIdSchema, { functionId })
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getFunctionProfiles(parsed.functionId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

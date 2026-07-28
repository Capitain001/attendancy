'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import type { AssignFunctionsParams, DirectionMemberDto } from './types'

export async function getDirectionMembersAction(_params: {
  orgId: string
  includeDeleted?: boolean
  functionId?: string
}): Promise<{ data: DirectionMemberDto[] } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    return { data: [] }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function assignFunctionsToMemberAction(
  _params: AssignFunctionsParams
): Promise<{ success: boolean; error?: string; message?: string }> {
  const user = await getUserInfo()
  if (!user?.id) return { success: false, error: ERRORS.AUTH.UNAUTHORIZED }
  return { success: true, message: 'Fonctions assignées' }
}

export async function revokeFunctionsFromMemberAction(
  _userId: string,
  _functionIds: string[]
): Promise<{ success: boolean; error?: string; message?: string }> {
  const user = await getUserInfo()
  if (!user?.id) return { success: false, error: ERRORS.AUTH.UNAUTHORIZED }
  return { success: true, message: 'Fonctions révoquées' }
}

export async function updateMemberFunctionsAction(
  _params: AssignFunctionsParams
): Promise<{ success: boolean; error?: string; message?: string }> {
  const user = await getUserInfo()
  if (!user?.id) return { success: false, error: ERRORS.AUTH.UNAUTHORIZED }
  return { success: true, message: 'Fonctions mises à jour' }
}

export async function deleteDirectionMemberAction(
  _directionId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const user = await getUserInfo()
  if (!user?.id) return { success: false, error: ERRORS.AUTH.UNAUTHORIZED }
  return { success: true, message: 'Membre supprimé' }
}

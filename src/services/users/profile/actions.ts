'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import type { FunctionProfile, UserProfile } from './types'

export async function getFunctionProfilesAction(
  _functionId: string
): Promise<{ data: FunctionProfile[] } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    return { data: [] }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getUserProfileAction(
  _userId: string
): Promise<{ data: UserProfile } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    return { error: 'Not implemented' }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

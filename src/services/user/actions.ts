'use server'
import { getUserInfo } from './userInfo'
import { setUserInfo } from './update'
import { ERRORS } from '@/config'
import type { UserRoleStats } from '@/services/users/stats'

export async function updateAvatar(avatarUrl: string): Promise<{ data: true } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    await setUserInfo({ avatar_url: avatarUrl })
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getUserRoleStatsAction(): Promise<{ data: UserRoleStats } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    return { data: { total: 0, direction: 0, teachers: 0, students: 0, others: 0 } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

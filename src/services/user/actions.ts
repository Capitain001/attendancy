'use server'
import { getUserInfo } from './userInfo'
import { setUserInfo } from './update'
import { ERRORS } from '@/config'
import type { UserRoleStats } from '@/services/users/stats'
import { prisma } from '@/lib/prisma'


export async function updateAvatar(avatarUrl: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id || !user?.email) return { error: ERRORS.AUTH.UNAUTHORIZED }

    await setUserInfo({ avatar_url: avatarUrl })

    await prisma.user.upsert({
      where: { email: user.email },
      update: { avatar_url: avatarUrl },
      create: {
        id: user.id,
        email: user.email,
        avatar_url: avatarUrl,
        firstName: user.name || " ",
        lastName: user.name || " ",
      },
    })

    return { data: true as const }
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

'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'

export async function generateTokenAction(
  sessionId: string
): Promise<{ data: { token: string; url: string; expiresAt: string } } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const url = `/session/${sessionId}/join?token=${token}`
    return { data: { token, url, expiresAt } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

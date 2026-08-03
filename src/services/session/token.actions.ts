'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'

export async function generateTokenAction(
  sessionId: string
) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const url = `/session/${sessionId}/join?token=${token}`
    return { data: { token, url, expiresAt } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

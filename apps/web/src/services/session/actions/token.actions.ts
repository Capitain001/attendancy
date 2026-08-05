'use server'
import { ERRORS } from '@/config'
import { getUserInfo } from '@/modules/user'
import { getAuthorization } from '@/modules/auth'
import { createSessionToken } from '../database/token.mutations'

export async function generateTokenAction(sessionId: string) {
  try {
    const user = await getUserInfo()
    if (!user) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const auth = getAuthorization(user, ['TEACHER', 'DIRECTION'])
    if (!auth.success) return { error: auth.error }
    const data = await createSessionToken(sessionId)
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

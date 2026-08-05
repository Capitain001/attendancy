'use server'
import { ERRORS } from '@/config'
import { authAccess } from '@/services/auth'
import { createSessionToken } from '../database/token.mutations'

export async function generateTokenAction(sessionId: string) {
  const auth = await authAccess({ requiredRole: ['TEACHER', 'DIRECTION'] })
  if (!auth.data) return { error: auth.error }

  try {
    return { data: await createSessionToken(sessionId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getReferentials, getReferentialWithPrograms } from '../database/referential.queries'

export async function getReferentialsAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }

  try {
    return { data: await getReferentials() }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getReferentialAction(referentialId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }

  try {
    return { data: await getReferentialWithPrograms(referentialId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

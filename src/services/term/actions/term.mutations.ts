// src/services/term/actions/term.mutations.ts
'use server'
import { pipe, string, uuid, parse } from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { generateTermsFromProgram } from '../database'

const classIdSchema = pipe(string(), uuid('Classe invalide'))

export async function generateTermsFromProgramAction(classId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) throw new Error(ERRORS.AUTH.UNAUTHORIZED)

    const orgId = user.organization?.id
    if (!orgId) throw new Error(ERRORS.ORG.NOT_FOUND)

    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) throw new Error(auth.error)

    const validClassId = parse(classIdSchema, classId)
    const terms = await generateTermsFromProgram(validClassId, orgId)
    return { data: terms }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

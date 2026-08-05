// src/services/term/actions/term.mutations.ts
'use server'
import { pipe, string, uuid, parse } from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { generateTermsFromProgram } from '../database'

const classIdSchema = pipe(string(), uuid('Classe invalide'))

export async function generateTermsFromProgramAction(classId: string) {

    const auth = await authAccess({ requiredRole: 'DIRECTION' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const validClassId = parse(classIdSchema, classId)
  try {
    const terms = await generateTermsFromProgram(validClassId, orgId)
    return { data: terms }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}
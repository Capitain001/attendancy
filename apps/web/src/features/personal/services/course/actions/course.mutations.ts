'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createPersonalCourseSchema } from '../validation'
import type { CreatePersonalCourseInput } from '../validation'
import { createPersonalCourse } from '../database'

export async function createPersonalCourseAction(input: CreatePersonalCourseInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createPersonalCourseSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  // Les erreurs de contrainte (doublon de cours…) remontent déjà mappées par tryConstraint.
  try {
    return { data: await createPersonalCourse({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

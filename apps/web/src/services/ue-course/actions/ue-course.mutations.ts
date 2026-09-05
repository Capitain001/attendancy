'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createUECourseSchema, updateUECourseSchema } from '../validation'
import type { CreateUECourseInput,UpdateUECourseInput } from '../validation'
import { createUECourse, removeUECourse, updateUECourse } from '../database'


export async function createUECourseAction(input: CreateUECourseInput) {
  const parsed = v.safeParse(createUECourseSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await createUECourse({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}


export async function updateUECourseAction({ ueCourseId, data }: { ueCourseId: string; data: UpdateUECourseInput }) {
  const parsed = v.safeParse(updateUECourseSchema, data)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await updateUECourse(ueCourseId, orgId, parsed.output) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeUECourseAction(ueCourseId: string) {
  // 1. Auth (pas de validation pour un ID simple)
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  // 2. Requête database (dans try/catch)
  try {
    return { data: await removeUECourse(ueCourseId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

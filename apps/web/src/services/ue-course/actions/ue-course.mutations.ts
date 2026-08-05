'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createUECourseSchema } from '../validation'
import type { CreateUECourseInput } from '../validation'
import { createUECourse, removeUECourse, updateUECourse } from '../database'
import type { UpdateUECourseData } from '../database'

export async function createUECourseAction(input: CreateUECourseInput) {
  // 1. Validation (hors try/catch) - safeParse
  const parsed = v.safeParse(createUECourseSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  }

  // 2. Auth
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  // 3. Requête database (dans try/catch)
  try {
    return { data: await createUECourse({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateUECourseAction(ueCourseId: string, data: UpdateUECourseData) {
  // 1. Auth (pas de validation pour un ID simple)
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  // 2. Requête database (dans try/catch)
  try {
    return { data: await updateUECourse(ueCourseId, orgId, data) }
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
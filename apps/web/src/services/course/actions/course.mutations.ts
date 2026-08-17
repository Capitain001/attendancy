'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createCourseSchema, updateCourseSchema } from '../validation'
import type { CreateCourseInput, UpdateCourseInput } from '../validation'
import { createCourse, removeCourse, updateCourse } from '../database'

export async function createCourseAction(input: CreateCourseInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' , requie})
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createCourseSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await createCourse({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateCourseAction(input: UpdateCourseInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(updateCourseSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await updateCourse(parsed.output.courseId, parsed.output.data, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeCourseAction(courseId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await removeCourse(courseId, orgId)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

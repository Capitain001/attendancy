'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { assignTeacherSchema, syncCourseTeachersSchema } from '../validation'
import type { AssignTeacherInput, SyncCourseTeachersInput } from '../validation'
import { assignTeacher, deleteTeacherFromCourse, syncCourseTeachers } from '../database'

export async function assignTeacherAction(input: AssignTeacherInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(assignTeacherSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await assignTeacher({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteTeacherAction(courseTeacherId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await deleteTeacherFromCourse(courseTeacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function syncCourseTeachersAction(input: SyncCourseTeachersInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(syncCourseTeachersSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    await syncCourseTeachers(parsed.output.courseId, parsed.output.principalId, parsed.output.assistantIds, orgId)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

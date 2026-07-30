'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { createCourseSchema, assignTeacherSchema } from '../validation'
import type { CreateCourseInput, AssignTeacherInput } from '../validation'
import { createCourse, assignTeacher, deleteTeacherFromCourse, removeCourse } from '../database'

export async function createCourseAction(input: CreateCourseInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(createCourseSchema, input)
    return { data: await createCourse({ ...parsed, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function assignTeacherAction(input: AssignTeacherInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(assignTeacherSchema, input)
    return { data: await assignTeacher({ ...parsed, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteTeacherAction(courseTeacherId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    return { data: await deleteTeacherFromCourse(courseTeacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeCourseAction(courseId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }
    await removeCourse(courseId, orgId)
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export { assignTeacherAction as assignCourseTeacherAction }
export { deleteTeacherAction as unassignCourseTeacherAction }

'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getCourse, getCourseDetail, getCourses, getCoursesByClass } from '../database'

export async function getCourseAction(courseId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getCourse(courseId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getAllCoursesAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getCourses(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getCoursesAction(classId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getCoursesByClass(classId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getCourseDetailAction(courseId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const data = await getCourseDetail(courseId, orgId)
    if (!data) return { error: 'Cours introuvable' }
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

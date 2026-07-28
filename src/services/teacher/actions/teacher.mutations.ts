'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { updateTeacherDepartmentSchema } from '../validation'
import type { UpdateTeacherDepartmentInput, CreateTeacherInput, UpdateTeacherInput } from '../validation'
import { updateTeacherDepartment } from '../database'

export async function createTeacherAction(_input: CreateTeacherInput) {
  return { error: 'Les enseignants sont créés via le flux invitation' } as const
}

export async function updateTeacherAction(teacherId: string, data: UpdateTeacherInput) {
  return updateTeacherDepartmentAction({ teacherId, departmentId: data.departmentId })
}

export async function deleteTeacherAction(_teacherId: string) {
  return { error: 'La suppression directe des enseignants n\'est pas supportée' } as const
}

export async function updateTeacherDepartmentAction(input: UpdateTeacherDepartmentInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(updateTeacherDepartmentSchema, input)
    return { data: await updateTeacherDepartment(parsed.teacherId, parsed.departmentId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

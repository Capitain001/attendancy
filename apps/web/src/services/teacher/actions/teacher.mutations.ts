'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/modules/user'
import { authAccess, getAuthorization } from '@/modules/auth'
import { ERRORS } from '@/config'
import { updateTeacherDepartmentSchema } from '../validation'
import type { UpdateTeacherDepartmentInput, CreateTeacherInput, UpdateTeacherInput } from '../validation'
import { updateTeacherDepartment } from '../database'



export async function updateTeacherDepartmentAction(input: UpdateTeacherDepartmentInput) {
  try {
    const auth = await authAccess({ 
      requiredRole: ['ADMIN', 'DIRECTION'], 
      requiredFunction: 'PRINCIPAL' 
    })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const parsed = v.safeParse(updateTeacherDepartmentSchema, input)
    if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
    
    return { data: await updateTeacherDepartment(parsed.output.teacherId, parsed.output.departmentId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

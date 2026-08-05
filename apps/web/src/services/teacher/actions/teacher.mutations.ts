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
  const parsed = v.parse(updateTeacherDepartmentSchema, input)
   const auth = await authAccess({ 
      requiredRole: ['ADMIN', 'DIRECTION'], 
      requiredFunction: 'PRINCIPAL' 
    })
    if (!auth.data) return { error: auth.error }
    
    const { orgId } = auth.data
    return { data: await updateTeacherDepartment(parsed.teacherId, parsed.departmentId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

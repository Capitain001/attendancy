'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getDepartments } from '../database'

export async function getDepartmentsAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getDepartments(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { enrollStudentSchema, assignStudentGroupSchema } from '../validation'
import type { EnrollStudentInput, AssignStudentGroupInput } from '../validation'
import { enrollStudent, removeEnrollment, assignStudentGroup, deleteStudentGroup } from '../database'
import { prisma } from '@/lib/prisma'
import type { UserStatus } from '@/generated/prisma/client'

export async function enrollStudentAction(input: EnrollStudentInput) {
  try {
    const auth = await authAccess({ requiredRole: 'DIRECTION' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const parsed = v.safeParse(enrollStudentSchema, input)
    if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
    return { data: await enrollStudent({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeEnrollmentAction(enrollmentId: string) {
  try {
    const auth = await authAccess({ requiredRole: 'DIRECTION' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    return { data: await removeEnrollment(enrollmentId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function assignStudentGroupAction(input: AssignStudentGroupInput) {
  try {
    const auth = await authAccess({ requiredRole: 'DIRECTION' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const parsed = v.safeParse(assignStudentGroupSchema, input)
    if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
    return { data: await assignStudentGroup({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function bulkSetStudentStatusAction(studentIds: string[], status: UserStatus) {
  try {
    const auth = await authAccess({ requiredRole: 'DIRECTION' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const result = await prisma.user.updateMany({
      where: { student: { some: { id: { in: studentIds }, orgId } } },
      data: { status },
    })
    return { data: { count: result.count } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteStudentGroupAction(studentGroupId: string) {
  try {
    const auth = await authAccess({ requiredRole: 'DIRECTION' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    return { data: await deleteStudentGroup(studentGroupId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

'use server'

import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getClasses, getClass, getActiveClassesCount } from '../database'
import { Level } from '@/generated/prisma/browser';
export async function getClassesAction({ yearId, programTrackId, name, level }: { yearId?: string; programTrackId?: string; name?: string; level?: Level } = {}) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data
    return { data: await getClasses({ orgId, yearId, programTrackId, name, level }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getActiveClassesCountAction() {
  const auth = await authAccess({ requiredRole: 'DIRECTION', allowPersonalOrg: true })
  if (!auth.data) return { error: auth.error }
  if (auth.data.user.organization?.type !== 'PERSONAL' || auth.data.user.role !== 'TEACHER') {
    return { error: 'Accès réservé au professeur personnel' }
  }

  try {
    return { data: await getActiveClassesCount(auth.data.orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getClassAction({ classId }: { classId: string }) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data
    return { data: await getClass({ classId, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

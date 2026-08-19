'use server'

import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getClasses, getClass } from '../database'
import { Level } from '@/generated/prisma/browser';
export async function getClassesAction({ yearId, programTrackId, name, level }: { yearId?: string; programTrackId?: string; name?: string; level?: Level }) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data
    return { data: await getClasses({ orgId, yearId, programTrackId, name, level }) }
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
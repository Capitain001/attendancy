'use server'
import { authAccess } from '@/services/auth'
import { getClassAction } from '@/services/class'
import { ERRORS } from '@/config'
import { getGroupsByClass, getGroupEligibleStudents } from '../database'

export async function getGroupsByClassAction(classId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getGroupsByClass(classId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Vue « gestion des groupes » : groupes de la classe + info classe (effectif inscrit).
// L'info classe est lue via l'action propriétaire (service class) — pas de prisma.class ici.
export async function getClassGroupsAction(input: { classId: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const [groups, classRes] = await Promise.all([
      getGroupsByClass(input.classId, orgId),
      getClassAction(input.classId),
    ])
    const cls = 'data' in classRes ? classRes.data : null
    return { data: { groups, class: cls } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getGroupEligibleStudentsAction(input: { classId: string; groupId: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: { students: await getGroupEligibleStudents(input.classId, input.groupId, orgId) } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

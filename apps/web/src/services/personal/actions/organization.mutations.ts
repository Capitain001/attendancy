'use server'

import { getRoleProfileKey, getUserInfo } from '@/modules/user'
import { setUserAccess } from '@/modules/user/access'

import { logAuditAsync } from '@/services/audit'
import { ERRORS } from '@/config'
import {
  createPersonalProfile,
  createPersonalOrgWithProfile,
} from '../database'
import { PERSONAL_ROLES, PersonalRole } from '@/modules/auth/constants'


// Ajoute un rôle à un espace perso DÉJÀ EXISTANT. orgId fourni par l'appelant
// (jamais résolu en interne, SERVICE_CONTEXT.md §4) — createPersonalOrgAction
// le connaît déjà quand il délègue ici.
export async function createPersonalProfileAction(orgId: string, role: PersonalRole) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

  if (!(PERSONAL_ROLES as readonly string[]).includes(role)) {
    return { error: ERRORS.AUTH.FORBIDDEN }
  }

  try {
    const profileId = await createPersonalProfile({ userId: user.id, orgId, role })

    const roleIdKey = getRoleProfileKey(role) // 'teacherId' | 'studentId' | 'parentId'
    const existingOrgs = user.organizations ?? []
    const existingSnapshot = existingOrgs.find((o) => o.id === orgId)

    // Merge, pas remplace : un teacherId déjà posé par un profil créé avant
    // doit survivre à la création d'un second profil (studentId, etc.).
    const orgSnapshot = {
      ...existingSnapshot,
      id: orgId,
      type: 'PERSONAL' as const,
      responsable: true as const,
      ...(roleIdKey ? { [roleIdKey]: profileId } : {}),
    }

    await setUserAccess({
      role, // rôle ACTIF — c'est lui que redirectUser lit
      organization: orgSnapshot,
      organizations: [...existingOrgs.filter((o) => o.id !== orgId), orgSnapshot],
    })

    return { data: { role } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}


// → À AJOUTER dans src/services/org/actions/org.mutations.ts
//
// SEUL point d'entrée appelé par l'UI (un clic sur un rôle). Deux chemins
// internes, mutuellement exclusifs :
//   - espace perso inexistant → bootstrap atomique (createPersonalOrgWithProfile)
//   - espace perso existant   → ajout de rôle (délègue à createPersonalProfileAction)
// L'appelant (bouton) n'a jamais à savoir dans lequel il tombe.
export async function createPersonalOrgAction(role: PersonalRole) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

  if (!(PERSONAL_ROLES as readonly string[]).includes(role)) {
    return { error: ERRORS.AUTH.FORBIDDEN }
  }

  const existing = user.organizations?.find((o) => o.type === 'PERSONAL')
  if (existing?.id) {
    return createPersonalProfileAction(existing.id, role)
  }

  try {
    const { org, profileId } = await createPersonalOrgWithProfile({
      userId: user.id,
      role,
      userName: user.name,
    })

    const roleIdKey = getRoleProfileKey(role)
    const snapshot = {
      id: org.id,
      name: org.name,
      slug: org.slug ?? undefined,
      type: 'PERSONAL' as const,
      responsable: true as const,
      ...(roleIdKey ? { [roleIdKey]: profileId } : {}),
    }

    await setUserAccess({
      ...(user.status === 'NEW' || user.status === 'PENDING' ? { status: 'ACTIVE' as const } : {}),
      role,
      organization: snapshot,
      organizations: [...(user.organizations ?? []), snapshot],
    })

    logAuditAsync({ userId: user.id, action: 'CREATE', resource: 'ORGANIZATION', resourceId: org.id, orgId: org.id })
    return { data: { slug: org.slug, role } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
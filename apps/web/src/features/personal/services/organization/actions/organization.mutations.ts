'use server'
import * as v from 'valibot'
import { ERRORS } from '@/config'
import { getRoleProfileKey, getUserInfo } from '@/modules/user'
import { setUserAccess } from '@/modules/user/access'
import type { PersonalRole } from '@/modules/auth/constants'
import { logAuditAsync } from '@/services/audit'
import { createPersonalOrgWithProfile, createPersonalProfile } from '../database'
import { personalRoleSchema } from '../validation'

function withRoleProfileId(role: PersonalRole, profileId: string) {
  const key = getRoleProfileKey(role)
  return key ? { [key]: profileId } : {}
}

// Ajoute un rôle à un espace perso existant de l'utilisateur.
export async function createPersonalProfileAction(orgId: string, role: PersonalRole) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  if (!v.is(personalRoleSchema, role)) return { error: ERRORS.AUTH.FORBIDDEN }

  const existingOrgs = user.organizations ?? []
  const personalOrg = existingOrgs.find((o) => o.id === orgId && o.type === 'PERSONAL')
  if (!personalOrg) return { error: ERRORS.AUTH.FORBIDDEN }

  try {
    const { profileId } = await createPersonalProfile({ userId: user.id, orgId, role })

    const snapshot = {
      ...personalOrg,
      id: orgId,
      type: 'PERSONAL' as const,
      responsable: true as const,
      ...withRoleProfileId(role, profileId),
    }

    await setUserAccess({
      role,
      organization: snapshot,
      organizations: [...existingOrgs.filter((o) => o.id !== orgId), snapshot],
    })

    return { data: { role } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Point d'entrée UI : crée l'espace perso, ou ajoute un rôle s'il existe déjà.
export async function createPersonalOrgAction(role: PersonalRole) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  if (!v.is(personalRoleSchema, role)) return { error: ERRORS.AUTH.FORBIDDEN }

  const existing = user.organizations?.find((o) => o.type === 'PERSONAL')
  if (existing?.id) return createPersonalProfileAction(existing.id, role)

  try {
    const { org, profileId } = await createPersonalOrgWithProfile({
      userId: user.id,
      role,
      userName: user.name,
    })

    const snapshot = {
      id: org.id,
      name: org.name,
      slug: org.slug ?? undefined,
      type: 'PERSONAL' as const,
      responsable: true as const,
      ...withRoleProfileId(role, profileId),
    }

    await setUserAccess({
      ...(user.status === 'NEW' ? { status: 'PENDING' as const } : {}),
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
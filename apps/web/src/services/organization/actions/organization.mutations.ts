// src/services/org/actions/org.mutations.ts
'use server'
import { redirect } from 'next/navigation'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { getRoleProfileKey, getUserInfo } from '@/modules/user'
import { getAuthorization } from '@/modules/auth/persmission/autorization'
import { setUserInfo } from '@/modules/user/update'
import { redirectUser } from '@/config/redirects'
import { ORG_INFO_URL, ORG_PROFILE_URL } from '@/config'
import type { Role } from '@/types/user'
import { logAuditAsync } from '@/services/audit'
import { ERRORS } from '@/config'
import { orgSetupSchema, updateOrgIdentitySchema } from '../validation'
import type { OrgSetupInput, UpdateOrgIdentityInput } from '../validation'
import type { OrgDetails } from '../types'
import {
  createOrgWithDefaults,
  updateOrganization,
  setOrgDetails,
  setMemberStatusWithAudit,
  updateOrgLogo,
  createPersonalProfile,
  createPersonalOrgWithProfile,
  ensurePersonalAcademicScaffold,
} from '../database'

// Cas spécial : l'utilisateur n'a pas encore d'org — authAccess exige orgId et échouerait.
// On passe par getUserInfo directement + getAuthorization pour vérifier role/function.
export async function createOrgAction(input: OrgSetupInput) {

  console.log('createOrgAction: user authorized for org creation')
  const user = await getUserInfo()
  console.log('createOrgAction: user info retrieved', user?.id)
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

  const authCheck = getAuthorization(user, 'DIRECTION', 'PRINCIPAL')
  if (authCheck.error) return { error: authCheck.error }
  
console.log('createOrgAction: user authorized for org creation', user.id)
  const parsed = v.safeParse(orgSetupSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const { org, directionId } = await createOrgWithDefaults({
      userId: user.id,
      name: parsed.output.name,
      slug: parsed.output.slug,
      email: parsed.output.email,
    })

    const orgSnapshot = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      responsable: true as const,
      directionId,
    }

    await setUserInfo({ status: 'ACTIVE', organization: orgSnapshot, organizations: [orgSnapshot] })
    logAuditAsync({ userId: user.id, action: 'CREATE', resource: 'ORGANIZATION', resourceId: org.id, orgId: org.id })

    return { data: { slug: org.slug } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Édition identité par DIRECTION/PRINCIPAL : name, email, domain, logo uniquement.
export async function updateOrgIdentityAction(input: UpdateOrgIdentityInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION', requiredFunction: 'PRINCIPAL' })
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  const parsed = v.safeParse(updateOrgIdentitySchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const org = await updateOrganization(orgId, parsed.output)
    logAuditAsync({ userId: user.id, action: 'UPDATE', resource: 'ORGANIZATION', resourceId: orgId, orgId })
    return { data: org }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Mise à jour des détails (infos contact, champs personnalisés) par DIRECTION.
export async function setOrgDetailsAction(details: OrgDetails) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  try {
    await setOrgDetails(orgId, details)
    return { data: { ...user.organization, details } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function setCurrentOrganizationAction(organizationId: string): Promise<void> {
  const user = await getUserInfo()
  if (!user?.id) redirect('/login')

  const organization = user.organizations?.find((item) => item.id === organizationId)
  if (!organization) redirect(`${ORG_INFO_URL}?error=unavailable`)
  if (!organization.slug) redirect('/auth/org/setup')

  try {
    await setUserInfo({ organization })
  } catch {
    redirect(`${ORG_INFO_URL}?error=switch`)
  }

  redirect(redirectUser({ ...user, organization }))
}

export async function ensurePersonalAcademicScaffoldAction() {
  const auth = await authAccess({ requiredRole: 'DIRECTION', allowPersonalOrg: true })
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data
  if (user.organization?.type !== 'PERSONAL' || user.role !== 'TEACHER') {
    return { error: ERRORS.AUTH.FORBIDDEN }
  }

  try {
    return { data: await ensurePersonalAcademicScaffold(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function selectOrganizationProfileAction(
  organizationId: string,
  role: Role,
): Promise<void> {
  const user = await getUserInfo()
  if (!user?.id) redirect('/login')

  const chooserUrl = `${ORG_PROFILE_URL}?organizationId=${encodeURIComponent(organizationId)}`
  const allowedRoles: readonly Role[] = ['TEACHER', 'STUDENT', 'PARENT', 'DIRECTION', 'ADMIN', 'GUEST']
  if (!allowedRoles.includes(role)) {
    redirect(`${chooserUrl}&error=unavailable`)
  }

  const organizations = user.organizations ?? []
  const organization = organizations.find((item) => item.id === organizationId)
    ?? (user.organization?.id === organizationId ? user.organization : undefined)
  const profileField = role === 'GUEST' ? null : getRoleProfileKey(role)
  const isCurrentProfile = user.organization?.id === organizationId && user.role === role
  const hasProfile = profileField ? Boolean(organization?.[profileField]) : false

  if (!organization
    || (organization.type === 'PERSONAL' && !(PERSONAL_ROLES as readonly string[]).includes(role))
    || (!hasProfile && !isCurrentProfile)) {
    redirect(`${chooserUrl}&error=unavailable`)
  }
  if (!organization.slug) redirect('/auth/org/setup')

  const synchronizedOrganizations = organizations.some((item) => item.id === organizationId)
    ? organizations
    : [...organizations, organization]

  try {
    await setUserInfo({
      role,
      organization,
      organizations: synchronizedOrganizations,
    })
  } catch {
    redirect(`${chooserUrl}&error=switch`)
  }

  redirect(redirectUser({ ...user, role, organization }))
}

export async function updateOrgLogoAction(logoUrl: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await updateOrgLogo(orgId, logoUrl) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Activation/désactivation d'un membre — ADMIN+ requis.
export async function setMemberStatusAction(params: {
  userId: string
  role: 'STUDENT' | 'TEACHER'
  status: 'ACTIVE' | 'INACTIVE'
  profileId?: string
}) {
  const auth = await authAccess({ requiredRole: 'ADMIN' })
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  try {
    return {
      data: await setMemberStatusWithAudit({
        orgId,
        userId: params.userId,
        role: params.role,
        status: params.status,
        actorUserId: user.id,
        profileId: params.profileId,
      }),
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}




import { createPersonalOrgWithDefaultsSchema } from '../validation'
import type { CreatePersonalOrgWithDefaultsInput } from '../validation'
import { createPersonalOrgWithDefaults } from '../database'
import { PERSONAL_ROLES, PersonalRole } from '@/modules/auth/constants'



// → À AJOUTER dans src/services/org/actions/org.mutations.ts
//
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

    await setUserInfo({
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
      displayName: user.name,
      isFirstOrg: !user.organizations?.length,
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

    await setUserInfo({
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
// src/services/org/actions/org.mutations.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { getUserInfo } from '@/modules/user'
import { getAuthorization } from '@/modules/auth/persmission/autorization'
import { setUserInfo } from '@/modules/user/update'
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
} from '../database'

// Cas spécial : l'utilisateur n'a pas encore d'org — authAccess exige orgId et échouerait.
// On passe par getUserInfo directement + getAuthorization pour vérifier role/function.
export async function createOrgAction(input: OrgSetupInput) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

  const authCheck = getAuthorization(user, 'DIRECTION', 'PRINCIPAL')
  if (authCheck.error) return { error: authCheck.error }

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
// src/services/org/actions/org.mutations.ts
// Server actions du service org.
// Pattern : getUserInfo (auth) → validation Valibot → database/ → { data }/{ error }.
'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { setUserInfo } from '@/services/user/update'
import { removeUsersByOrg } from '@/services/user/lru-cache'
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
  getOrgIdentity,
  getOrgUsage,
  getOrgDetails,
  getOrgDailyMetrics,
  getOrgResourcesCounts,
  getOrgBySlug,
} from '../database'

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createOrgAction(input: OrgSetupInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    if (user.organization?.id) return { error: 'Vous avez déjà une organisation' }

    const parsed = v.parse(orgSetupSchema, input)

    let result
    try {
      result = await createOrgWithDefaults({
        userId: user.id,
        name: parsed.name,
        slug: parsed.slug,
        email: parsed.email,
      })
    } catch (e) {
      const isUnique = e instanceof Error && (e.message.includes('Unique constraint') || e.message.includes('P2002'))
      return {
        error: isUnique
          ? 'Ce nom ou identifiant est déjà utilisé par un autre établissement'
          : "Erreur lors de la création de l'établissement",
      }
    }

    const { org, directionId } = result
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
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

// Édition identité par DIRECTION/PRINCIPAL : name, email, domain, logo uniquement.
export async function updateOrgIdentityAction(input: UpdateOrgIdentityInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    const orgSlug = user.organization?.slug
    if (!orgId || !orgSlug) return { error: ERRORS.ORG.NOT_FOUND }

    const auth = getAuthorization(user, 'DIRECTION', 'PRINCIPAL')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(updateOrgIdentitySchema, input)
    const org = await updateOrganization(orgId, parsed)

    removeUsersByOrg(orgSlug)
    logAuditAsync({ userId: user.id, action: 'UPDATE', resource: 'ORGANIZATION', resourceId: orgId, orgId })

    return { data: org }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

// Mise à jour des détails (infos contact, champs personnalisés) par DIRECTION.
export async function setOrgDetailsAction(details: OrgDetails) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    await setOrgDetails(orgId, details)

    return { data: { ...user.organization, details } }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

// Activation/désactivation d'un membre — ADMIN+ requis.
export async function setMemberStatusAction(params: {
  userId: string
  role: 'STUDENT' | 'TEACHER'
  status: 'ACTIVE' | 'INACTIVE'
  profileId?: string
}) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const auth = getAuthorization(user, 'ADMIN')
    if (!auth.success) return { error: auth.error }

    const result = await setMemberStatusWithAudit({
      orgId,
      userId: params.userId,
      role: params.role,
      status: params.status,
      actorUserId: user.id,
      profileId: params.profileId,
    })

    return { data: result }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getOrgIdentityAction() {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    return { data: await getOrgIdentity(orgId) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function getOrgUsageAction() {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    return { data: await getOrgUsage(orgId) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function getOrgDetailsAction() {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const details = await getOrgDetails(orgId)
    return { data: { ...user.organization, details } }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function getOrgDailyMetricsAction() {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    return { data: await getOrgDailyMetrics(orgId) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function getOrganizationBySlug(slug: string) {
  try {
    const organization = await getOrgBySlug(slug)
    return { organization }
  } catch (error) {
    return { organization: null }
  }
}

export async function updateOrganizationLogo(organizationId: string, logoUrl: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { success: false, error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId || orgId !== organizationId) return { success: false, error: ERRORS.AUTH.FORBIDDEN }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { success: false, error: auth.error }
    await updateOrgLogo(organizationId, logoUrl)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function getOrgResourcesCountsAction() {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    return { data: await getOrgResourcesCounts(orgId) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

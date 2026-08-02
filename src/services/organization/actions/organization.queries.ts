// src/services/org/actions/org.queries.ts
'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import {
  getOrgIdentity,
  getOrgUsage,
  getOrgDetails,
  getOrgDailyMetrics,
  getOrgResourcesCounts,
  getOrgBySlug,
} from '../database'

export async function getOrgIdentityAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getOrgIdentity(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getOrgUsageAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getOrgUsage(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getOrgDetailsAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  try {
    const details = await getOrgDetails(orgId)
    return { data: { ...user.organization, details } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getOrgDailyMetricsAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getOrgDailyMetrics(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getOrgResourcesCountsAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getOrgResourcesCounts(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Exception documentée : lookup public par slug, appelé avant authentification
// (page de login) — pas d'orgId token disponible, pas d'authAccess possible.
export async function getOrgBySlugAction(slug: string) {
  try {
    return { data: await getOrgBySlug(slug) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
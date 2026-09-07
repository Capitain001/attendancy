'use server'

import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import {
  getUserPermissions,
  getFunctionPermissions,
  getEffectivePermissionNames,
} from '../database'
import {
  getUserPermissionsSchema,
  getFunctionPermissionsSchema,
} from '../validation'
import type {
  GetUserPermissionsInput,
  GetFunctionPermissionsInput,
} from '../validation'

// Permissions d'un utilisateur CIBLÉ — admin only, userId validé (uuid).
export async function getUserPermissionsAction(input: GetUserPermissionsInput) {
  const auth = await authAccess({ requiredRole: 'ADMIN' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(getUserPermissionsSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await getUserPermissions(parsed.output.userId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Permissions de l'utilisateur COURANT — authentifié, userId dérivé du token serveur.
export async function getCurrentUserPermissionsAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  try {
    return { data: await getUserPermissions(user.id, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Permissions d'une fonction CIBLÉE — admin only, functionId validé (uuid).
export async function getFunctionPermissionsAction(input: GetFunctionPermissionsInput) {
  const auth = await authAccess({ requiredRole: 'ADMIN' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(getFunctionPermissionsSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await getFunctionPermissions(parsed.output.functionId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Permissions effectives (directes + héritées via Functions) d'un utilisateur CIBLÉ — admin only.
export async function getEffectivePermissionNamesAction(input: GetUserPermissionsInput) {
  const auth = await authAccess({ requiredRole: 'ADMIN' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(getUserPermissionsSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await getEffectivePermissionNames(parsed.output.userId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Permissions effectives de l'utilisateur COURANT — authentifié, userId dérivé du token serveur.
export async function getCurrentUserEffectivePermissionNamesAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  try {
    return { data: await getEffectivePermissionNames(user.id, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

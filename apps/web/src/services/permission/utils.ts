// src/services/permission/utils.ts
import type { Action, Resource } from '@/generated/prisma/browser'
import { ACTION_LABELS, RESOURCE_LABELS } from './constants'
import type { PermissionName } from './types'

// Sans ressource, le nom est celui de l'action seule (permission large). Un resourceId sans
// ressource n'a pas de sens et est ignoré : la validation et la base doivent l'interdire,
// sinon la ligne se lirait comme un droit sur toutes les ressources.
export function permissionName(action: Action, resource?: Resource | null, resourceId?: string | null): PermissionName {
  if (!resource) return action
  return resourceId ? `${action}:${resource}:${resourceId}` : `${action}:${resource}`
}

export function parsePermissionName(name: string): { action: Action; resource?: Resource; resourceId?: string } | null {
  const [action, resource, resourceId] = name.split(':') as [Action, Resource?, string?]
  if (!action) return null
  return { action, resource, resourceId }
}

export function permissionLabel(action: Action, resource?: Resource | null, resourceName?: string | null): string {
  const actionLabel = ACTION_LABELS[action]
  if (!resource) return actionLabel
  const resourceLabel = RESOURCE_LABELS[resource]
  return resourceName ? `${actionLabel} ${resourceLabel} : ${resourceName}` : `${actionLabel} ${resourceLabel}`
}

// Actions dont une permission accordée satisfait un contrôle sur `action` :
// CRUD couvre les quatre actions ; un contrôle CRUD n'est satisfait que par un droit CRUD.
function coveringActions(action: Action): Action[] {
  return action === 'CRUD' ? ['CRUD'] : [action, 'CRUD']
}

// Vérifie une permission contre la liste de noms effectifs (voir getEffectivePermissionNames).
// Pour chaque action qui couvre le contrôle, trois niveaux de portée, du plus fin au plus large :
//   exacte (avec resourceId) → toute la ressource (sans resourceId) → toutes les ressources (action seule).
// Un droit plus fin ne remonte jamais : `READ:STUDENT:123` ne satisfait pas un contrôle sur
// `READ:STUDENT`, ni `READ:TEACHER`.
// ⚠️ Correction vs V1 : le fallback resourceId → resource-level n'existait pas, un grant
// `UPDATE:STUDENT` ne couvrait donc pas `UPDATE:STUDENT:123`, contrairement à l'intention du
// modèle (resourceId nullable = "permission large").
export function hasPermission(
  cachedPermissions: string[],
  check: { action: Action; resource: Resource; resourceId?: string }
): boolean {
  const granted = new Set(cachedPermissions)
  return coveringActions(check.action).some(
    (action) =>
      (!!check.resourceId && granted.has(permissionName(action, check.resource, check.resourceId))) ||
      granted.has(permissionName(action, check.resource)) ||
      granted.has(permissionName(action))
  )
}

export function hasAnyPermission(cachedPermissions: string[], checks: Parameters<typeof hasPermission>[1][]) {
  return checks.some((c) => hasPermission(cachedPermissions, c))
}

export function hasAllPermissions(cachedPermissions: string[], checks: Parameters<typeof hasPermission>[1][]) {
  return checks.every((c) => hasPermission(cachedPermissions, c))
}
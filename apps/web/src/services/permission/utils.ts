import type { Action, Resource } from '@/generated/prisma/browser'
import { ACTION_LABELS, RESOURCE_LABELS } from './constants'
import type { PermissionName } from './types'

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

// Vérifie une permission contre le cache JWT (organization.permissions).
// Ordre de fallback : exacte (avec resourceId) → générique sur la ressource
// (sans resourceId, couvre tous les resourceId) → wildcard action (`ACTION:*`).
// ⚠️ Correction vs V1 : `utils.ts.userHasPermission` ne vérifiait jamais le
// fallback resourceId → resource-level ; un grant `UPDATE:STUDENT` ne
// couvrait donc pas `UPDATE:STUDENT:123`, contrairement à l'intention du
// modèle (resourceId nullable = "permission large").
export function hasPermission(
  cachedPermissions: string[],
  check: { action: Action; resource: Resource; resourceId?: string }
): boolean {
  const specific = permissionName(check.action, check.resource, check.resourceId)
  if (cachedPermissions.includes(specific)) return true
  if (check.resourceId && cachedPermissions.includes(permissionName(check.action, check.resource))) return true
  return cachedPermissions.includes(`${check.action}:*`)
}

export function hasAnyPermission(cachedPermissions: string[], checks: Parameters<typeof hasPermission>[1][]) {
  return checks.some((c) => hasPermission(cachedPermissions, c))
}

export function hasAllPermissions(cachedPermissions: string[], checks: Parameters<typeof hasPermission>[1][]) {
  return checks.every((c) => hasPermission(cachedPermissions, c))
}
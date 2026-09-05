
import { Action, Resource } from "@/generated/prisma/client";
import { ActionLabels, ResourceLabels } from "./types";


/**
 * Génère le nom lisible et standardisé d'une permission
 * @param action - action de la permission
 * @param resource - ressource cible
 * @param resourceName - nom spécifique de la ressource (facultatif)
 * @returns PermissionName typé
 */
export function getPermissionName(
  action: Action,
  resource?: Resource | null,
  resourceName?: string | null
): PermissionName {
  if (!resource) {
    // seulement l'action (rare, par défaut)
    return action as PermissionName;
  }

  if (resourceName) {
    // permission spécifique
    return `${action}:${resource}:${resourceName}` as PermissionName;
  }

  // permission globale
  return `${action}:${resource}` as PermissionName;
}

/**
 * Génère un label humain lisible
 */
export function getPermissionLabel(
  action: Action,
  resource?: Resource | null,
  resourceName?: string | null
): string {
  const actionLabel = ActionLabels[action];
  if (!resource) return actionLabel;

  const resourceLabel = ResourceLabels[resource];

  if (resourceName) {
    return `${actionLabel} ${resourceLabel}: ${resourceName}`;
  }

  return `${actionLabel} ${resourceLabel}`;
}


/**
 * Convertit un PermissionName (UPDATE:COURSE:Math) en label lisible ("Update course: Math")
 */
export function permissionNameToLabel(permissionName: PermissionName): string {
    const parts = permissionName.split(":");
  
    const action = parts[0] as keyof typeof ActionLabels;
    const resource = parts[1] as keyof typeof ResourceLabels;
    const resourceName = parts[2] ?? null;
  
    const actionLabel = ActionLabels[action];
    const resourceLabel = ResourceLabels[resource];
  
    if (resourceName) {
      return `${actionLabel} ${resourceLabel}: ${resourceName}`;
    }
  
    return `${actionLabel} ${resourceLabel}`;
  }

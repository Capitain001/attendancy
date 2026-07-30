// src/services/auth/authorization.ts
// Autorisation — fonctions PURES (pas d'I/O, testables unitairement).
// Trois niveaux orthogonaux :
//   1. Rôle (hiérarchie)          — getAuthorization(user, requiredRole)
//   2. Fonction (RBAC fin)        — getAuthorization(user, role, requiredFunction)
//   3. Permission (action:resource) — userHasPermission / authorize
import type { Role, Functions as FunctionName, UserInfo } from '@/services/user/types'

export type AuthorizationResult =
  | { success: true }
  | { success: false; error: string }

export interface Permission {
  /** Format libre "ACTION" — ex : CREATE, UPDATE, DELETE */
  action: string
  /** Format libre "RESOURCE" — vocabulaire du projet */
  resource: string
  resourceId?: string
}

// Hiérarchie : rôle requis → rôles qui le satisfont.
// ADMIN satisfait tout rôle requis (ligne par ligne).
// ⚠ À CONFIGURER PAR PROJET — une entrée par rôle du projet.
// Lecture : TEACHER: ['TEACHER', 'ADMIN'] = « TEACHER requis : un TEACHER ou un ADMIN passe ».
const ROLE_HIERARCHY: Record<Role, Role[]> = {
  ADMIN:     ['ADMIN'],
  DIRECTION: ['DIRECTION', 'ADMIN'],
  TEACHER:   ['TEACHER', 'ADMIN'],
  STUDENT:   ['STUDENT', 'ADMIN'],
  PARENT:    ['PARENT', 'ADMIN'],
  GUEST:     ['GUEST', 'ADMIN'],
}

// Vérifie rôle (hiérarchie) puis fonction (égalité stricte, sauf ADMIN).
// La fonction SUPER_ADMIN (plateforme) court-circuite tout.
export function getAuthorization(
  user: Partial<UserInfo>,
  requiredRole?: Role | Role[],
  requiredFunction?: FunctionName
): AuthorizationResult {
  const userRole = user.role
  const userFunction = user.function

  if (!userRole) return { success: false, error: 'Utilisateur non authentifié' }

  if (userFunction === 'SUPER_ADMIN') return { success: true }

  if (requiredRole) {
    const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const allowed = required.some((r) => ROLE_HIERARCHY[r]?.includes(userRole))
    if (!allowed) {
      return {
        success: false,
        error: `Rôle ${userRole} insuffisant (requis: ${required.join(', ')})`,
      }
    }
  }

  if (requiredFunction && userRole !== 'ADMIN' && userFunction !== requiredFunction) {
    return {
      success: false,
      error: `Fonction ${userFunction} insuffisante (requise: ${requiredFunction})`,
    }
  }

  return { success: true }
}

// Permissions fines "ACTION:RESOURCE[:id]" — lues depuis le snapshot org des
// métadonnées ("ACTION:*" = wildcard sur la ressource).
export function userHasPermission(user: UserInfo, permission: Permission): boolean {
  const perms = user.organization?.permissions
  if (!perms) return false

  const key = `${permission.action}:${permission.resource}${permission.resourceId ? `:${permission.resourceId}` : ''}`
  return perms.includes(key) || perms.includes(`${permission.action}:*`)
}

// Rôle + permission en un appel.
export function authorize(
  user: UserInfo,
  requiredRole: Role,
  permission?: Permission
): AuthorizationResult {
  if (!user?.role) return { success: false, error: 'Utilisateur non valide' }

  const roleCheck = getAuthorization(user, requiredRole)
  if (!roleCheck.success) return roleCheck

  if (permission && user.function !== 'SUPER_ADMIN') {
    if (!userHasPermission(user, permission)) {
      return {
        success: false,
        error: `Permission manquante: ${permission.action}:${permission.resource}`,
      }
    }
  }

  return { success: true }
}

// ── Helpers purs additionnels ─────────────────────────────────────────────────
// Toujours pures — l'appelant fournit user déjà chargé (pas de fetch interne).

export function userHasRole(user: Partial<UserInfo>, role: Role): boolean {
  return user.role === role
}

export function userHasFunction(
  user: Partial<UserInfo>,
  functionName: FunctionName | FunctionName[]
): boolean {
  if (!user.function) return false
  const names = Array.isArray(functionName) ? functionName : [functionName]
  return names.includes(user.function)
}

export function checkResourcePermission(
  user: UserInfo,
  action: string,
  resource: string,
  resourceId?: string
): AuthorizationResult {
  const permission: Permission = { action, resource, resourceId }
  if (userHasPermission(user, permission)) return { success: true }
  return {
    success: false,
    error: `Permission ${action}:${resource}${resourceId ? `:${resourceId}` : ''} refusée`,
  }
}

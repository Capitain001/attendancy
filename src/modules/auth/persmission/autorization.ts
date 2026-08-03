// utils/authorization.ts
import { UserInfo, Role, Functions, AuthenticatedUser } from "@/types/user";
import { Permission, PermissionAction, PermissionResource, AuthorizationResult } from "@/types/permissions";
import { getUserInfo } from '@/modules/user';
import { ROLE_HIERARCHY } from "./config";
import { ERRORS } from "@/config";




// ==========================================
// autorisation
// ==========================================


/**
 * Vérifie l'autorisation d'un utilisateur selon son rôle et/ou sa fonction.
 *
 * Règles :
 * - SUPER_ADMIN : accès total.
 * - Les rôles sont validés via ROLE_HIERARCHY.
 * - ADMIN bypasse la vérification de fonction.
 *
 * @param user - user => userInfo
 * @param requiredRole - Rôle requis (Role | Role[])
 * @param requiredFunction -  Fonction requise (Functions)
 *
 * @returns AuthorizationResult
 * - { success: true } si l'accès est autorisé
 * - { success: false, error: string } si l'accès est refusé
 *
 * @example
 * // Vérifie uniquement le rôle
 * await getAuthorization(user, "ADMIN");
 *
 * @example
 * // Vérifie plusieurs rôles (TEACHER ou DIRECTION)
 * await getAuthorization(user, ["TEACHER", "DIRECTION"]);
 *
 * @example
 * // Vérifie uniquement la fonction (ADMIN bypasse)
 * await getAuthorization(user, undefined, "PRINCIPAL");
 *
 * @example
 * // Vérifie rôle + fonction
 * // - DIRECTION => fonction "PRINCIPAL"
 * await getAuthorization(user, "DIRECTION", "PRINCIPAL");
 *
 * @example
 * // Résultat
 * const result = await getAuthorization(user, "TEACHER");
 * if (!result.success) {
 *   console.error(result.error);
 * }
 */

export function getAuthorization(
  user: Partial<UserInfo>,
  requiredRole?: Role | Role[],
  requiredFunction?: Functions
): AuthorizationResult {
  const userRole = user.role;
  const userFunction = user.function;

  if (!userRole) {
    return { error: ERRORS.AUTH.UNAUTHORIZED };
  }

  if (userFunction === "SUPER_ADMIN") {
    return { error: null };
  }

  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const isRoleAllowed = requiredRoles.some((role) => ROLE_HIERARCHY[role]?.includes(userRole));

    if (!isRoleAllowed) {
      return {
        error: `Rôle ${userRole} insuffisant (requis: ${requiredRoles.join(", ")})`,
      };
    }
  }

  if (requiredFunction && userRole !== "ADMIN" && userFunction !== requiredFunction) {
    return {
      error: `Fonction ${userFunction} insuffisante (requise: ${requiredFunction})`,
    };
  }

  return { error: null };
}




/**
 * Vérifie si l'utilisateur a la permission spécifique
 * @param user - Informations de l'utilisateur
 * @param permission - Permission à vérifier
 * @returns true si l'utilisateur a la permission, false sinon
 * 
 * @example
 * const hasPermission = await userHasPermission(user, {
 *   action: 'CREATE',
 *   resource: 'USER'
 * });
 */
export async function userHasPermission(
  user: UserInfo, 
  permission: Permission
) {
  if (!user.organization?.permissions) return false;
  
  const userPermissions = user.organization.permissions;
  
  // Convertit la permission en format string pour comparaison
  const permissionString = `${permission.action}:${permission.resource}${permission.resourceId ? `:${permission.resourceId}` : ''}`;

  // Vérification directe de la permission
  if (userPermissions.includes(permissionString)) return true;

  // Vérification avec wildcard (ex: "CREATE:*" permet toutes les créations)
  return userPermissions.includes(`${permission.action}:*`);
}

/**
 * Vérifie à la fois le rôle et les permissions de l'utilisateur
 * @param user - Informations de l'utilisateur
 * @param requiredRole - Rôle minimum requis
 * @param permission - Permission spécifique requise (optionnelle)
 * @returns Résultat de l'autorisation avec message d'erreur si échec
 * 
 * @example
 * // Vérifie seulement le rôle
 * const result = await authorize(user, 'TEACHER');
 * 
 * @example
 * // Vérifie rôle + permission
 * const result = await authorize(user, 'ADMIN', {
 *   action: 'DELETE',
 *   resource: 'USER'
 * });
 */
export async function authorize(
  user: UserInfo, 
  requiredRole: Role, 
  permission?: Permission
) {
  
  if (!user?.role) {
    return { success: false, error: "Utilisateur non valide" };
  }

  // Vérification du rôle
  const roleCheck = await getAuthorization(user, requiredRole);
  if (roleCheck.error) {
  return roleCheck;
}

  // Vérification de la permission (sauf pour SUPER_ADMIN qui a toutes les permissions)
  if (permission && user.function !== "SUPER_ADMIN") {
    if (!(await userHasPermission(user, permission))) {
      return { 
        success: false, 
        error: `Permission manquante: ${permission.action}:${permission.resource}` 
      };
    }
  }

  return { success: true };
}

/**
 * Vérifie les permissions granulaires sur une ressource spécifique
 * @param user - Informations de l'utilisateur
 * @param action - Action à vérifier
 * @param resource - Ressource concernée
 * @param resourceId - ID spécifique de la ressource (optionnel)
 * @returns Résultat de l'autorisation
 * 
 * @example
 * // Vérifie si l'utilisateur peut modifier un cours spécifique
 * const result = await checkResourcePermission(
 *   user, 
 *   'UPDATE', 
 *   'COURSE', 
 *   'course-123'
 * );
 */

export async function checkResourcePermission(
  user: UserInfo,
  action: PermissionAction,
  resource: PermissionResource,
  resourceId?: string
) {
  const permission: Permission = {
    action,
    resource,
    resourceId,
  };

  if (await userHasPermission(user, permission)) {
    return {
      error: null,
    };
  }

  return {
    error: `Permission ${action}:${resource}${resourceId ? `:${resourceId}` : ""} refusée`,
  };
}
/**
 * Vérifie si l'utilisateur a un rôle spécifique
 * @param role - Rôle à vérifier
 * @returns true si l'utilisateur a le rôle, false sinon
 */
export async function userHasRole(role: Role): Promise<boolean> {
  const userInfo = await getUserInfo();
  return userInfo?.role === role;
}


/**
 * Vérifie si l'utilisateur a une fonction spécifique ou une des fonctions
 * @param functionName - Fonction(s) à vérifier (peut être une fonction unique ou un tableau)
 * @returns true si l'utilisateur a la/les fonction(s), false sinon
 */
export async function userHasFunction(functionName: Functions | Functions[]): Promise<boolean> {
  const userInfo = await getUserInfo();
  if (!userInfo?.function) return false;
  
  const userFunction = userInfo.function;
  const functionsToCheck = Array.isArray(functionName) ? functionName : [functionName];
  
  return functionsToCheck.includes(userFunction);
}
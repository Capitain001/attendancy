// src/modules/auth/persmission/autorization.ts
import { UserInfo, Role, Functions } from "@attendancy/user";
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
 * Les permissions fines ne se vérifient pas ici : elles se lisent en base (en cache) et passent
 * par authAccess({ requiredPermission }) — voir acces.ts.
 *
 * @param user - user => userInfo
 * @param requiredRole - Rôle requis (Role | Role[])
 * @param requiredFunction - Fonction requise (Functions | Functions[])
 *
 * @example
 * // Vérifie plusieurs fonctions (PRINCIPAL ou SECRETARY)
 * await getAuthorization(user, "DIRECTION", ["PRINCIPAL", "SECRETARY"]);
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
  user: Pick<UserInfo, 'role' | 'function' | 'organization'>,
  requiredRole?: Role | Role[],
  requiredFunction?: Functions | Functions[],
  options?: {   allowPersonalOrg?: boolean } // ← nouveau, opt-in, défaut false
) {
  const userRole = user.role;
  const userFunction = user.function;

  if (!userRole) {
    return { error: ERRORS.AUTH.UNAUTHORIZED };
  }

  if (userFunction === "SUPER_ADMIN") {
    return { error: null };
  }

   // Propriétaire d'org perso : équivalence TEACHER ↔ DIRECTION, mais SEULEMENT
  // si l'appelant l'a explicitement demandé (opt-in par action, jamais global).
  if (
    options?.allowPersonalOrg &&
    user.organization?.type === 'PERSONAL' &&
    userRole === 'TEACHER'
  ) {
    return { error: null } // bypass rôle ET fonction — pas de RBAC fin en solo
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

  if (requiredFunction && userRole !== "ADMIN") {
    const requiredFunctions = Array.isArray(requiredFunction) ? requiredFunction : [requiredFunction];
    const isFunctionAllowed = !!userFunction && requiredFunctions.includes(userFunction);

    if (!isFunctionAllowed) {
      return {
        error: `Fonction ${userFunction} insuffisante (requise: ${requiredFunctions.join(", ")})`,
      };
    }
  }

  return { error: null };
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
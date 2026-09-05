// src/services/auth/permission/access.ts
"use server";

import { getUserInfo } from '@/modules/user';
import { getAuthorization } from "./autorization";
import { UserInfo, Role, Functions, AuthenticatedUser } from "@/types/user";
import { ERRORS } from "@/config";


export async function getAuthUser() {
  const user = await getUserInfo();
  if (!user) {
    console.error(ERRORS.AUTH.UNAUTHORIZED);
    throw new Error(ERRORS.AUTH.UNAUTHORIZED);
  }
  return user;
}



type AuthAccessParams = {
  requiredRole?: Role | Role[];
  requiredFunction?: Functions;
};

/**
 * Vérifie l'authentification et les permissions de l'utilisateur
 * Retourne le contexte utilisateur (user + orgId) nécessaire pour les opérations
 *
 * @param params - Paramètres de vérification d'autorisation
 * @param params.requiredRole - Rôle requis (optionnel)
 * @param params.requiredFunction - Fonction requise (optionnel)
 *
 * @example
 * ```ts
 * // Vérification basique (juste authentification)
 * const auth = await authAccess();
 *
 * // Vérification avec rôle ADMIN
 * const auth = await authAccess({ requiredRole: "ADMIN" });
 *
 * // Vérification avec fonction PRINCIPAL
 * const auth = await authAccess({ requiredFunction: "PRINCIPAL" });
 *
 * // Vérification avec rôle ET fonction
 * const auth = await authAccess({
 *   requiredRole: "ADMIN",
 *   requiredFunction: "PRINCIPAL"
 * });
 *
 * if (auth.error) {
 *   return { error: auth.error };
 * }
 * const { user, orgId } = auth.data;
 * ```
 */



export async function authAccess(params: AuthAccessParams = {}){
  try {
    const user = await getUserInfo();
    if (!user?.id) {
      return { error: ERRORS.AUTH.UNAUTHORIZED };
    }

    const orgId = user.organization?.id;
    if (!orgId) {
      return { error: ERRORS.ORG.NOT_FOUND };
    }

    // id/role/function/name/email garantis par getUserInfo (fallback + flow d'inscription)
    const authenticatedUser = user as AuthenticatedUser;

    if (params.requiredRole || params.requiredFunction) {
      const auth = getAuthorization(authenticatedUser, params.requiredRole, params.requiredFunction);
      if (auth.error) {
        return { error: auth.error };
      }
    }

    return { data: { user: authenticatedUser, orgId } };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : ERRORS.SERVER,
    };
  }
}

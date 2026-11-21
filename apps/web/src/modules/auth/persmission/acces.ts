// src/modules/auth/persmission/acces.ts
"use server";

import { getUserInfo } from '@/modules/user';
import { getAuthorization } from "./autorization";
import { Role, Functions, AuthenticatedUser } from "@/types/user";
import { ERROR_CODES, ERRORS } from "@/config";
import { hasPermission } from '@/services/permission'
import type { Action, Resource } from '@/generated/prisma/client'
import type { OrganizationType } from '@/generated/prisma/browser'

type AuthAccessParams = {
  requiredRole?: Role | Role[]
  requiredFunction?: Functions | Functions[]
  requiredPermission?: { action: Action; resource: Resource; resourceId?: string }
  requiredOrgType?: OrganizationType
  allowPersonalOrg?: boolean
}


/**
 * Vérifie l'authentification et les permissions de l'utilisateur
 * Retourne le contexte utilisateur (user + orgId) nécessaire pour les opérations
 *
 * @param params - Paramètres de vérification d'autorisation
 * @param params.requiredRole - Rôle requis (optionnel)
 * @param params.requiredFunction - Fonction requise (optionnel)
 * @param params.requiredOrgType - Type d'organisation active requis (optionnel)
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
export async function authAccess(params: AuthAccessParams = {}) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED, code: ERROR_CODES.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND, code: ERROR_CODES.ORG_NOT_FOUND }

    // Le scope d'organisation s'applique aussi aux SUPER_ADMIN 
    if (params.requiredOrgType && user.organization?.type !== params.requiredOrgType) {
      return { error: ERRORS.AUTH.FORBIDDEN, code: ERROR_CODES.FORBIDDEN }
    }

    const authenticatedUser = user as AuthenticatedUser

    if (params.requiredRole || params.requiredFunction) {
      const auth = getAuthorization(authenticatedUser, params.requiredRole, params.requiredFunction, {
        allowPersonalOrg: params.allowPersonalOrg,
      })
      if (auth.error) return { error: auth.error, code: ERROR_CODES.FORBIDDEN }
    }

    // SUPER_ADMIN bypasse déjà via getAuthorization ; ici on ne re-vérifie
    // la permission fine que si un rôle/fonction insuffisant ne l'a pas
    // déjà rejetée — évite un check redondant sur le chemin ADMIN.
    if (params.requiredPermission) {
      const cached = authenticatedUser.organization?.permissions ?? []
      if (authenticatedUser.function !== 'SUPER_ADMIN' && !hasPermission(cached, params.requiredPermission)) {
        return { error: ERRORS.AUTH.FORBIDDEN, code: ERROR_CODES.FORBIDDEN }
      }
    }

    return { data: { user: authenticatedUser, orgId } }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER, code: ERROR_CODES.SERVER }
  }
}


export async function getAuthUser() {
  const user = await getUserInfo();
  if (!user) {
    console.error(ERRORS.AUTH.UNAUTHORIZED);
    throw new Error(ERRORS.AUTH.UNAUTHORIZED);
  }
  return user;
}

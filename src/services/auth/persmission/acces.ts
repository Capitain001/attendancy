// src/services/auth/permission/access.ts
"use server";

import { getUserInfo } from "@/services/user";
import { getAuthorization } from "./autorization";
import type { UserInfo, Role, Functions } from "@/services/user/types";
import { ERRORS } from "@/config";

type FunctionName = Functions;

const AUTH_ERROR = ERRORS.AUTH.UNAUTHORIZED;

export async function getAuthUser() {
  const user = await getUserInfo();
  if (!user) {
    console.error(AUTH_ERROR);
    throw new Error(AUTH_ERROR);
  }
  return user;
}


type AuthAccessResult = {
  success: true;
  data?: unknown;
  user?: Partial<UserInfo>;
  orgId?: string;
} | {
  success: false;
  error: string;
};

type AuthAccessParams = {
  requiredRole?: Role;
  requiredFunction?: Functions;
};

export async function authAccess(params: AuthAccessParams = {}): Promise<AuthAccessResult> {
  try {
    const user = await getUserInfo();
    if (!user) {
      return { success: false, error: AUTH_ERROR };
    }

    if (params.requiredRole || params.requiredFunction) {
      const auth = await getAuthorization(
        user,
        params.requiredRole,
        params.requiredFunction
      );

      if (auth.success === false) {
        return { success: false, error: auth.error };
      }
    }

    const orgId = user?.organization?.id;
    if (!orgId) {
      return { success: false, error: "Organisation non trouvée" };
    }

    return {
      success: true,
      user: user,
      orgId: orgId
    };
  } catch (error) {
    console.error("Erreur vérification accès:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur serveur"
    };
  }
}

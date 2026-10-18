

import { User as SupabaseUser } from "@supabase/supabase-js";
import { AppMetadata, Functions, UserInfo, UserMetadata, UserRoles, UserStatus } from "@/types/user";



/**
 * Construit `UserInfo` à partir d'un utilisateur Supabase en fusionnant ses trois sources :
 * - `app_metadata`  : role, function, status, organization(s) (lu SANS repli sur user_metadata)
 * - `user_metadata` : name, avatar_url, phone, invitation... (profil, non fiable pour autoriser)
 * - champs natifs   : id, email, email_verified / phone_verified (dérivés de *_confirmed_at)
 *
 * Valeurs par défaut les plus restrictives : GUEST, PENDING, organizations = [].
 * L'appelant n'a pas à savoir de quel magasin provient une valeur.
 */
export function mapUserInfo({ user }: { user: SupabaseUser }): UserInfo {
  const access = (user.app_metadata ?? {}) as AppMetadata
  const profile = (user.user_metadata ?? {}) as UserMetadata

  return {
    id: user.id,
    email: user.email ?? undefined,
    email_verified: Boolean(user.email_confirmed_at),
    phone_verified: Boolean(user.phone_confirmed_at),
    role: access.role || UserRoles.GUEST,
    function: access.function || Functions.MEMBER,
    status: access.status || UserStatus.PENDING,
    organization: access.organization ?? undefined,
    organizations: access.organizations || [],
    name: profile.name || user.email?.split("@")[0] || "",
    avatar_url: profile.avatar_url,
    phone: profile.phone,
    invited_by: profile.invited_by ?? undefined,
    invitationToken: profile.invitationToken ?? undefined,
    invitationType: profile.invitationType ?? undefined,
    isConnected: profile.isConnected ?? true,
    updated_at: user.updated_at,
  }
}


/**
 * Génère un objet UserInfo limité aux champs souhaités
 *
 * @param user - l'objet UserInfo complet
 * @param keys - tableau des champs à garder
 * @returns objet contenant seulement les champs sélectionnés
 */
export const generateUserInfo = <K extends keyof UserInfo>(
  user: UserInfo,
  keys: K[],
  overrides?: Partial<UserInfo> // ← Nouveau: permet de surcharger des valeurs
): Pick<UserInfo, K> => {
  const result = {} as Pick<UserInfo, K>
  keys.forEach((key) => {
    if (overrides && key in overrides) {
      // Utilise la valeur override si fournie
      result[key] = overrides[key] as any
    } else if (user[key] !== undefined) {
      result[key] = user[key]
    }
  })
  return result
}


export async function superAdminStatus(user:UserInfo) {

    if (!user) return false;
  
    return (
      user?.email === process.env.SUPER_ADMIN_EMAIL ||
      user?.function === "SUPER_ADMIN"
    );
  }
  

  export function checkSuperAdminStatus(user: any) {
    return (
      user?.email === process.env.SUPER_ADMIN_EMAIL ||
      user?.app_metadata?.function === "SUPER_ADMIN" ||
      user?.function === "SUPER_ADMIN"
    );
  }
  


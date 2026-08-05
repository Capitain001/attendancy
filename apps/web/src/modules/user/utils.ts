

import { User as SupabaseUser } from "@supabase/supabase-js";
import { Functions, UserInfo, UserMetadata, UserRoles, UserStatus } from "@/types/user";


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
      user?.user_metadata?.function === "SUPER_ADMIN" ||
      user?.function === "SUPER_ADMIN"
    );
  }
  

  export function mapUserInfo({user, userMetadata}: {user:SupabaseUser, userMetadata:UserMetadata}): UserInfo {

    const userInfo: UserInfo = {
      id: user.id,
      email: user.email || undefined,
      role: userMetadata.role || UserRoles.GUEST,
      name: userMetadata.name || user.email?.split("@")[0] || "",
      avatar_url: userMetadata.avatar_url || "/avatar.png",
      function: userMetadata.function || Functions.MEMBER ,
      organization: userMetadata.organization || undefined,
      organizations: userMetadata.organizations || [],
      invited_by: userMetadata.invited_by || undefined,
      status: userMetadata.status || UserStatus.PENDING,
      invitationToken: userMetadata.invitationToken || undefined,
      invitationType: userMetadata.invitationType || undefined,                
    };
  
    return userInfo;
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



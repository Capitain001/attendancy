// src/modules/user/utils.ts
import type { UserInfo } from "@attendancy/user";

/**
 * Génère un objet UserInfo limité aux champs souhaités
 *
 * @param user - l'objet UserInfo complet
 * @param keys - tableau des champs à garder
 * @returns objet contenant seulement les champs sélectionnés
 */
export const generateUserInfo = <K extends keyof UserInfo>(
  user: UserInfo,
  keys: readonly K[],
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

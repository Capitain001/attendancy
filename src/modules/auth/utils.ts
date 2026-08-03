import { UserInfo } from "@/types";
import { getUserInfo } from '@/modules/user';



/**
 * Exemple d'utilisation depuis un composant server/client :
 * 
 * import { getOrganization, getOrgId, isSuperAdmin, signUpResponsable } from "@/modules/user";
 * 
 * const org = await getOrganization();
 * const orgId = await getOrgId();
 * const superAdmin = await isSuperAdmin();
 */


export async function getOrganization({ user }: { user?: UserInfo } = {}) {
  // Si aucun user n'est fourni, on le récupère depuis getUserInfo()
  const currentUser = user ?? (await getUserInfo());

  if (!currentUser) return null;

  return {
    orgName: currentUser.organization?.name || null,
    orgId: currentUser.organization?.id || null,
    role: currentUser.role || null,
  };
}



export async function getOrgId() {
  const user = await getUserInfo()

  if (!user) return null;

  return user?.organization?.id || null;
}



export async function isSuperAdmin(user?: UserInfo) {
  // Si aucun user n'est fourni, on le récupère depuis getUserInfo()
  const currentUser = user ?? (await getUserInfo());

  if (!currentUser) return false;

  return (
    currentUser.email === process.env.SUPER_ADMIN_EMAIL ||
    currentUser.function === "SUPER_ADMIN"
  );
}


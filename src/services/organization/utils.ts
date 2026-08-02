// src/services/organization/utils.ts
import slugify from "slugify";
import { prisma } from "@/lib/prisma";

import { getUserInfo } from "@/services/user";
import { cache } from "react";

export async function getOrganization() {
  const user = await getUserInfo()
  if (!user) return null;
  return {
    orgName: user?.organization?.name || null,
    orgId: user?.organization?.id || null,
    role: user?.role || null,
  };
}



/**
 * Récupère l'ID de l'organisation de l'utilisateur authentifié
 * - Utilise un cache côté serveur pour dédupliquer les appels
 * - Retourne null si l'utilisateur n'a pas d'organisation
 * 
 * @throws Error si l'utilisateur n'est pas authentifié
 */
export const getOrgId = cache(async (): Promise<string> => {
  const user = await getUserInfo();
  if (!user?.organization?.id) {
    throw new Error("Not authenticated or organization not found");
  }
  return user.organization.id;
});
  
  export function sanitizedDomain(domain?: string): string | null {
    return domain && domain.trim() !== "" ? domain.trim() : null;
  }
  
  export async function generateUniqueSlug({ name }: { name: string }): Promise<string> {
    let baseSlug = slugify(name, { lower: true, strict: true });
    let uniqueSlug = baseSlug;
    let count = 1;
  
    while (await prisma.organization.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${count}`;
      count++;
    }
  
    return uniqueSlug;
  }
  ;
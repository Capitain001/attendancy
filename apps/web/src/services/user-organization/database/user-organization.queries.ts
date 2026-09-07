import { cacheTag, cacheLife } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE } from "@/cache/server/key";

export async function getUserOrganizations(orgId: string) {
  "use cache";
  cacheTag(CACHE.USER_ORGANIZATION(orgId));
  cacheLife(CACHE.USER_ORGANIZATION.life);
  // TODO: select explicite — pas de findMany({}) sans select
  return prisma.userOrganization.findMany({
    where: { orgId },
    select: { id: true },
  });
}

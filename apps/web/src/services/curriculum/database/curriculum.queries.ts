import { cacheTag, cacheLife } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE } from "@/cache/server/key";

export async function getCurriculums(orgId: string) {
  "use cache";
  cacheTag(CACHE.CURRICULUM(orgId));
  cacheLife(CACHE.CURRICULUM.life);
  // TODO: select explicite — pas de findMany({}) sans select
  return prisma.curriculum.findMany({
    where: { orgId },
    select: { id: true },
  });
}

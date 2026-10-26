//apps\web\src\services\class\personal\database\class.queries.ts
import { CACHE } from "@/cache/server/key"
import { prisma } from "@/lib/prisma"
import { PERSONAL } from "@/services/personal"
import { cacheLife , cacheTag} from "next/cache"

export async function getDefaultPersonalClass(orgId: string) {
  'use cache'
  cacheTag(CACHE.CLASS(orgId))
  cacheLife('hours')

  return prisma.class.findFirst({
    where: { name: PERSONAL.NAME, programTrack: { orgId }, deletedAt: null },
    select: { id: true, name: true, type: true },
  })
}
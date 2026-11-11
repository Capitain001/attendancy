// src/features/personal/services/class/database/class.queries.ts
//apps\web\src\services\class\personal\database\class.queries.ts
import { CACHE } from "@/cache/server/key"
import { PERSONAL } from "@/features/personal/constants"
import { prisma } from "@/lib/prisma"


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


/**
 * Classes de l'espace perso : champs minimaux pour l'affichage.
 * classId optionnel : sans lui, toutes les classes de l'org ; avec lui,
 * uniquement celle-ci (liste vide si elle n'appartient pas à l'org).
 *
 * Compteurs : étudiants = inscriptions encore actives (endedAt null),
 * cours = cours non archivés (deletedAt null).
 */
export async function getPersonalClasses(orgId: string, classId?: string) {
  "use cache";
  cacheTag(CACHE.CLASS(orgId));
  cacheLife(CACHE.CLASS.life);

  return prisma.class.findMany({
    where: {
      deletedAt: null,
      programTrack: { orgId },
      ...(classId && { id: classId }),
    },
    select: {
      id: true,
      name: true,
      type: true,
      _count: {
        select: {
          studentEnrollments: { where: { endedAt: null } },
          courses: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}
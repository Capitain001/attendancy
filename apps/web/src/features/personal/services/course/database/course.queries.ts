// src/features/personal/services/course/database/course.queries.ts
import { prisma } from "@/lib/prisma";
import { CACHE } from "@/cache/server/key";
import { cacheLife, cacheTag } from "next/cache";

// Lecture légère des cours : de quoi lister, grouper (updatedAt) et afficher
// un volume horaire + un effectif. classId optionnel : sans lui, tous les
// cours de l'org ; avec lui, ceux d'une seule classe.
//
// Effectif = inscriptions encore actives (endedAt null) dans le Group lié au
// cours (Course.group, relation propre à l'espace perso). Un cours sans
// groupe renvoie 0.
export async function getPersonalCourses(orgId: string, classId?: string) {
  "use cache";
  cacheTag(CACHE.COURSE(orgId));
  cacheLife("minutes");

  return prisma.course.findMany({
    where: { orgId, deletedAt: null, ...(classId && { classId }) },
    select: {
      id: true,
      name: true,
      durationTotal: true,
      durationDone: true,
      updatedAt: true,
      settings:true,
      group: {
        select: {
          id: true,
          _count: {
            select: {
              studentGroups: { where: { enrollment: { endedAt: null } } },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}
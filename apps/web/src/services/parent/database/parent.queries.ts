// src/services/parent/database/parent.queries.ts
//
// Domaine Parent — OWNER de `Parent` / `ParentRelation` uniquement.
// Le reste (planning, présence, cours de l'enfant) est construt dans services les
// owners (student/schedule/attendance) avec le `studentId` de l'enfant.
// Voir doc/proposals/parent-vision.md §4.

import { CACHE } from "@/cache/server/key";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// import { CACHE, CACHE_DURATION } from "@/config/cache";

/* =========================
   ENFANTS — liste des enfants liés au parent (scopés org via la classe)
========================= */


export async function getParentStudents(parentId: string, orgId: string) {
  return unstable_cache(
    async () => {
      const relations = await prisma.parentRelation.findMany({
        where: {
          parentId,
          deletedAt: null,
          student: {
            deletedAt: null,
            user: { deletedAt: null },
            // scope org : enfant inscrit dans une classe de cette organisation
            studentEnrollments: {
              some: { deletedAt: null, class: { programTrack: { orgId } } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
        select: {
          relation: true,
          student: {
            select: {
              id: true,

              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar_url: true,
                  dateOfBirth: true,
                },
              },

              // enrollment actif (scopé org) — uniquement le nom de classe pour le hub.
              // PAS de classId/groupIds ici : le détail les obtient via getStudentProfile.
              studentEnrollments: {
                where: { deletedAt: null, class: { programTrack: { orgId } } },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { class: { select: { name: true } } },
              },
            },
          },
        },
      });

      return relations.map((r) => ({
        studentId: r.student.id,
        relation: r.relation,
        firstName: r.student.user.firstName,
        lastName: r.student.user.lastName,
        avatarUrl: r.student.user.avatar_url,
        dateOfBirth: r.student.user.dateOfBirth,
        className: r.student.studentEnrollments[0]?.class.name ?? null,
      }));
    },
    ["parent", "students", orgId, parentId],
    {
      // revalidate: CACHE_DURATION.MEDIUM,
      // tags: [CACHE.PARENT(orgId, parentId)],
    },
  )();
}

/* =========================
   GARDE DE SÉCURITÉ — ce parent est-il bien lié à cet enfant ?
   À appeler dans CHAQUE action scopée enfant avant toute lecture.
========================= */

import { cache } from "react";


export const isStudentParent = cache(
  async (
    parentId: string,
    studentId: string,
  ): Promise<boolean> => {
    // findFirst (plus de @@unique Prisma sur le couple : unicité = index partiel).
    // Filtre deletedAt: une relation soft-deletée ne donne plus l'accès.
    const rel = await prisma.parentRelation.findFirst({
      where: {
        parentId,
        studentId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    return rel !== null;
  },
);

/* =========================
   ÉMISSION NOTIFS (Lot P5) — userId des parents liés à des étudiants donnés.
   Conditionner l'appelant à `Organization.parentalNotifications`.
========================= */

/* =========================
   DIRECTION — recherche de parents éligibles au rattachement (P-18 A)
   Parents (rôle PARENT) de l'org, filtrés par texte. excludeStudentId retire
   ceux déjà liés. Non caché (recherche paramétrée) — cf. searchStudentsForEnrollment.
========================= */

export async function searchEligibleParents(params: {
  orgId: string;
  query: string;
  excludeStudentId?: string;
}) {
  const { orgId, excludeStudentId } = params;
  const query = params.query.trim();

  const parents = await prisma.parent.findMany({
    where: {
      deletedAt: null,
      user: {
        deletedAt: null,
        userOrganizations: { some: { orgId, role: "PARENT" } },
        ...(query
          ? {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      ...(excludeStudentId
        ? {
            NOT: {
              parentRelations: {
                some: { studentId: excludeStudentId, deletedAt: null },
              },
            },
          }
        : {}),
    },
    take: 10,
    orderBy: [
      { user: { lastName: "asc" } },
      { user: { firstName: "asc" } },
    ],
    select: {
      id: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar_url: true,
        },
      },
    },
  });

  return parents.map((p) => ({
    parentId: p.id,
    userId: p.user.id,
    firstName: p.user.firstName,
    lastName: p.user.lastName,
    email: p.user.email,
    avatarUrl: p.user.avatar_url,
  }));
}

export async function getParentUserIdsForStudents(
  studentIds: string[],
  orgId: string,
) {
  if (studentIds.length === 0) return [];
  const relations = await prisma.parentRelation.findMany({
    where: {
      studentId: { in: studentIds },
      deletedAt: null,
      parent: {
        deletedAt: null,
        user: {
          deletedAt: null,
          userOrganizations: { some: { orgId, role: "PARENT" } },
        },
      },
    },
    select: { parent: { select: { userId: true } } },
  });
  return [...new Set(relations.map((r) => r.parent.userId))];
}

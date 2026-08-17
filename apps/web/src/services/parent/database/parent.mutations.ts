// src/services/parent/database/parent.mutations.ts
//
// Domaine Parent — OWNER de ParentRelation. Mutations d'assignation/retrait d'un
// parent à un étudiant (direction), atomiques + audit (P-18 A, P-19 C).

import { invalidateCache } from "@/cache/server/key";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";


/**
 * Garde scope org du PARENT uniquement (la vraie inconnue : parentId vient d'un
 * formulaire client). Le studentId est déjà scopé org en amont par
 * getDirectionStudentDetail(studentId, orgId) → pas de re-résolution (§3/§4).
 */
async function assertParentInOrg(parentId: string, orgId: string) {
  const parent = await prisma.parent.findFirst({
    where: {
      id: parentId,
      deletedAt: null,
      user: {
        deletedAt: null,
        userOrganizations: { some: { orgId, role: "PARENT" } },
      },
    },
    select: { id: true, userId: true },
  });
  if (!parent) throw new Error("Parent introuvable dans cette organisation");
  return { parentUserId: parent.userId };
}

/** Lie un parent à un étudiant (P-18 A), atomique + audit + invalidation. */
export async function createParentRelationWithAudit(params: {
  orgId: string;
  parentId: string;
  studentId: string;
  relation: string;
  actorUserId: string;
}): Promise<{ relationId: string }> {
  const { orgId, parentId, studentId, relation, actorUserId } = params;
  const { parentUserId } = await assertParentInOrg(parentId, orgId);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rel = await tx.parentRelation.create({
        data: { parentId, studentId, relation, orgId },
      });
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "CREATE",
          resource: "STUDENT",
          resourceId: studentId,
          orgId,
          details: {
            event: "PARENT_LINKED",
            parentId,
            parentUserId,
            studentId,
            relation,
            orgId,
          } as Prisma.InputJsonValue,
        },
      });
      return { relationId: rel.id };
    });

    await invalidateCache("STUDENT", orgId);
    await invalidateCache("STUDENT", orgId, studentId);
    // await invalidateCache("PARENT", orgId, parentId);

    return result;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Ce parent est déjà lié à cet étudiant");
    }
    throw error;
  }
}

/**
 * Retire une relation parent (hard-delete au MVP — P-19), tracée en AuditLog.
 * relationId est l'inconnue (soumise par le client) → garde scope org par les
 * deux extrémités (parent ET étudiant membres de l'org).
 */
export async function deleteParentRelationWithAudit(params: {
  orgId: string;
  relationId: string;
  actorUserId: string;
}): Promise<{ relationId: string; studentId: string; parentId: string }> {
  const { orgId, relationId, actorUserId } = params;

  // Scope org direct (A-XX) : orgId porté par la relation.
  const rel = await prisma.parentRelation.findFirst({
    where: { id: relationId, orgId},
    select: {
      id: true,
      studentId: true,
      parentId: true,
      parent: { select: { userId: true } },
    },
  });
  if (!rel) throw new Error("Relation introuvable");

  await prisma.$transaction(async (tx) => {
    // Suppression physique de la relation
    await tx.parentRelation.delete({
      where: { id: rel.id },
    });
    await tx.auditLog.create({
      data: {
        userId: actorUserId,
        action: "DELETE",
        resource: "STUDENT",
        resourceId: rel.studentId,
        orgId,
        details: {
          event: "PARENT_UNLINKED",
          parentId: rel.parentId,
          parentUserId: rel.parent.userId,
          studentId: rel.studentId,
          orgId,
        } as Prisma.InputJsonValue,
      },
    });
  });

  await invalidateCache("STUDENT", orgId);
  await invalidateCache("STUDENT", orgId, rel.studentId);
  // await invalidateCache("PARENT", orgId, rel.parentId);

  return { relationId: rel.id, studentId: rel.studentId, parentId: rel.parentId };
}

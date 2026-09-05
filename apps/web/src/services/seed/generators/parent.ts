import { prisma } from "@/lib/prisma";
import { generateFakeIdentity } from "../utils/identity";
import { pickRandom, sampleN } from "../utils/random";
import { buildSeedMark, createSeedBatchId } from "../tag/tag";
import { ensureSeedingAllowed } from "../guards/guard";

export interface GenerateParentsOptions {
  count?: number;
  // Nombre d'enfants (étudiants existants de l'org, tirés au hasard SANS
  // remise) à rattacher à chaque parent généré. 0 = parents orphelins de
  // tout lien, utile pour tester le flux d'ajout manuel de ParentRelation.
  linkToRandomStudents?: number;
}

export interface GenerateParentResultItem {
  status: "created" | "failed";
  userId?: string;
  parentId?: string;
  linkedStudentIds?: string[];
  email?: string;
  fullName?: string;
  reason?: string;
}

const RELATION_LABELS = ["Père", "Mère", "Tuteur légal"] as const;

export async function generateParents(
  orgId: string,
  options: GenerateParentsOptions = {},
): Promise<GenerateParentResultItem[]> {
  await ensureSeedingAllowed(orgId);

  const count = options.count ?? 10;
  const childrenPerParent = options.linkToRandomStudents ?? 1;
  const seedBatchId = createSeedBatchId();

  // Chargé une fois : le pool d'étudiants candidats est le même pour tous
  // les parents générés dans cet appel (un étudiant peut avoir plusieurs
  // parents — ParentRelation n'est unique que sur (parentId, studentId)).
  const students = childrenPerParent > 0
    ? await prisma.student.findMany({ where: { orgId, deletedAt: null }, select: { id: true } })
    : [];

  const results: GenerateParentResultItem[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const identity = generateFakeIdentity();

      const user = await prisma.user.create({
        data: {
          firstName: identity.firstName,
          lastName: identity.lastName,
          email: identity.email,
          phone: identity.phone,
          sex: identity.sex,
          dateOfBirth: identity.dateOfBirth,
          details: buildSeedMark(seedBatchId, "parent"),
          userOrganizations: { create: { orgId, role: "PARENT" } },
          parent: { create: { orgId } },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          parent: { select: { id: true } },
        },
      });

      const parentId = user.parent[0]?.id;
      const linkedStudentIds: string[] = [];

      if (parentId) {
        const children = sampleN(students, childrenPerParent);
        for (const child of children) {
          await prisma.parentRelation.create({
            data: {
              orgId,
              parentId,
              studentId: child.id,
              relation: pickRandom(RELATION_LABELS) ?? "Tuteur légal",
            },
          });
          linkedStudentIds.push(child.id);
        }
      }

      results.push({
        status: "created",
        userId: user.id,
        parentId,
        linkedStudentIds,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
      });
    } catch (error) {
      results.push({ status: "failed", reason: error instanceof Error ? error.message : "Erreur inconnue" });
    }
  }

  return results;
}

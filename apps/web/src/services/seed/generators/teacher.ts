import { prisma } from "@/lib/prisma";
import { generateFakeIdentity } from "../utils/identity";
import { pickRandom } from "../utils/random";
import { buildSeedMark, createSeedBatchId } from "../tag/tag";
import { ensureSeedingAllowed } from "../guards/guard";

export interface GenerateTeachersOptions {
  // Nombre d'enseignants à générer — c'est le "props" mentionné : optionnel,
  // défaut raisonnable pour un jeu de test.
  count?: number;
  // Si fourni, tous les profs générés sont rattachés à ce département.
  // Sinon, un département de l'org est tiré au hasard par prof (ou aucun,
  // si l'org n'a pas encore de département — Teacher.departmentId est nullable).
  departmentId?: string;
}

export interface GenerateTeacherResultItem {
  status: "created" | "failed";
  userId?: string;
  teacherId?: string;
  email?: string;
  fullName?: string;
  reason?: string;
}

export async function generateTeachers(
  orgId: string,
  options: GenerateTeachersOptions = {},
): Promise<GenerateTeacherResultItem[]> {
  await ensureSeedingAllowed(orgId);

  const count = options.count ?? 10;
  const seedBatchId = createSeedBatchId();

  const departments = options.departmentId
    ? [{ id: options.departmentId }]
    : await prisma.department.findMany({ where: { orgId }, select: { id: true } });

  const results: GenerateTeacherResultItem[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const identity = generateFakeIdentity();
      const departmentId = pickRandom(departments)?.id;

      const user = await prisma.user.create({
        data: {
          firstName: identity.firstName,
          lastName: identity.lastName,
          email: identity.email,
          phone: identity.phone,
          sex: identity.sex,
          dateOfBirth: identity.dateOfBirth,
          details: buildSeedMark(seedBatchId, "teacher"),
          userOrganizations: { create: { orgId, role: "TEACHER" } },
          teacher: { create: { orgId, departmentId } },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          teacher: { select: { id: true } },
        },
      });

      results.push({
        status: "created",
        userId: user.id,
        teacherId: user.teacher[0]?.id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
      });
    } catch (error) {
      results.push({ status: "failed", reason: error instanceof Error ? error.message : "Erreur inconnue" });
    }
  }

  return results;
}

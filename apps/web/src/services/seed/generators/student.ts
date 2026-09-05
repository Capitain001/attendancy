import { prisma } from "@/lib/prisma";
import { generateFakeIdentity } from "../utils/identity";
import { buildSeedMark, createSeedBatchId } from "../tag/tag";
import { ensureSeedingAllowed } from "../guards/guard";

export interface GenerateStudentsOptions {
  count?: number;
  // Si fourni, chaque étudiant généré est directement inscrit dans cette
  // classe (StudentEnrollment) — pratique pour peupler une classe de test
  // en un seul appel plutôt que générer puis inscrire séparément.
  enrollInClassId?: string;
}

export interface GenerateStudentResultItem {
  status: "created" | "failed";
  userId?: string;
  studentId?: string;
  enrollmentId?: string;
  email?: string;
  fullName?: string;
  reason?: string;
}

export async function generateStudents(
  orgId: string,
  options: GenerateStudentsOptions = {},
): Promise<GenerateStudentResultItem[]> {
  await ensureSeedingAllowed(orgId);

  const count = options.count ?? 10;
  const seedBatchId = createSeedBatchId();

  // Vérifié UNE fois avant la boucle plutôt qu'à chaque itération : la
  // classe cible ne change pas d'un étudiant à l'autre dans cet appel.
  if (options.enrollInClassId) {
    const classRow = await prisma.class.findFirst({
      where: { id: options.enrollInClassId, deletedAt: null, academicYear: { orgId, isActive: true } },
      select: { id: true },
    });
    if (!classRow) {
      throw new Error("Classe introuvable ou année académique clôturée pour l'inscription automatique");
    }
  }

  const results: GenerateStudentResultItem[] = [];

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
          details: buildSeedMark(seedBatchId, "student"),
          userOrganizations: { create: { orgId, role: "STUDENT" } },
          student: { create: { orgId } },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          student: { select: { id: true } },
        },
      });

      const studentId = user.student[0]?.id;
      let enrollmentId: string | undefined;

      if (studentId && options.enrollInClassId) {
        const enrollment = await prisma.studentEnrollment.create({
          data: { studentId, classId: options.enrollInClassId },
          select: { id: true },
        });
        enrollmentId = enrollment.id;
      }

      results.push({
        status: "created",
        userId: user.id,
        studentId,
        enrollmentId,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
      });
    } catch (error) {
      results.push({ status: "failed", reason: error instanceof Error ? error.message : "Erreur inconnue" });
    }
  }

  return results;
}

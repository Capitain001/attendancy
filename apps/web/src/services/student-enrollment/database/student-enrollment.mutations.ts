import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { tryConstraint } from "@/utils/server/prisma";
import { invalidateEvent } from "@/cache/server/key";
import type { CreateStudentEnrollmentData } from "../types";
import type {
  CreateStudentEnrollmentOutput,
  UpdateStudentEnrollmentDataOutput,
  EnrollStudentsInClassOutput,
} from "../validation";

type PrismaOrTx = typeof prisma | Prisma.TransactionClient;

export type EnrollmentResultStatus = "created" | "reactivated" | "skipped" | "failed";

export interface EnrollmentMutationResult {
  studentId: string;
  status: EnrollmentResultStatus;
  enrollmentId?: string;
  reason?: string;
}

// ─── Garde-fous multi-tenant ─────────────────────────────────────────────────
// `create` n'a pas de `where` à filtrer par org : contrairement à un
// update/delete, on ne peut pas s'appuyer sur Prisma pour rejeter silencieusement
// une ligne hors périmètre. Il faut donc vérifier explicitement, AVANT toute
// création, que l'étudiant ET la classe appartiennent à orgId — sans ça,
// n'importe quel appelant pourrait inscrire un studentId ou classId d'une
// AUTRE organisation (c'était un trou de sécurité dans la version précédente
// de ce fichier : orgId était accepté en paramètre mais jamais utilisé).
async function assertEnrollmentEligible(
  client: PrismaOrTx,
  params: { studentId: string; classId: string; orgId: string },
) {
  const [student, classRow] = await Promise.all([
    client.student.findFirst({
      where: { id: params.studentId, orgId: params.orgId, deletedAt: null },
      select: { id: true },
    }),
    client.class.findFirst({
      where: {
        id: params.classId,
        deletedAt: null,
        academicYear: { orgId: params.orgId, isActive: true },
      },
      select: { id: true },
    }),
  ]);

  if (!student) throw new Error("Étudiant introuvable dans cette organisation");
  if (!classRow) throw new Error("Classe introuvable ou année académique clôturée");
}

function createStudentEnrollmentRaw(client: PrismaOrTx, data: CreateStudentEnrollmentData) {
  return tryConstraint(
    client.studentEnrollment.create({
      data,
      select: { id: true, studentId: true, classId: true },
    }),
  );
}

// `where` étendu (id + filtre de relation `student.orgId`) : Prisma rejette
// la mise à jour si l'inscription n'appartient pas à orgId, sans lecture
// préalable — c'est ce qui manquait avant pour scoper remove/update par org.
function endStudentEnrollmentRaw(client: PrismaOrTx, studentEnrollmentId: string, orgId: string) {
  return tryConstraint(
    client.studentEnrollment.update({
      where: { id: studentEnrollmentId, student: { orgId } },
      data: { endedAt: new Date() },
      select: { id: true, classId: true },
    }),
  );
}

// Réouvre une inscription déjà clôturée, SANS toucher classId : contrairement
// à un transfert de classe, ça ne réécrit aucun historique d'Attendance
// (l'enrollmentId ne change pas, seule sa fenêtre d'activité se rouvre).
function reopenStudentEnrollmentRaw(client: PrismaOrTx, studentEnrollmentId: string, orgId: string) {
  return tryConstraint(
    client.studentEnrollment.update({
      where: { id: studentEnrollmentId, student: { orgId } },
      data: { endedAt: null },
      select: { id: true, classId: true },
    }),
  );
}

// ─── API publique ────────────────────────────────────────────────────────────

export async function createStudentEnrollment(data: CreateStudentEnrollmentOutput, orgId: string) {
  await assertEnrollmentEligible(prisma, { studentId: data.studentId, classId: data.classId, orgId });
  const result = await createStudentEnrollmentRaw(prisma, data);
  await invalidateEvent("STUDENT_ENROLLMENT_CREATED", orgId, result.classId);
  return result;
}

export async function removeStudentEnrollment(studentEnrollmentId: string, orgId: string) {
  const result = await endStudentEnrollmentRaw(prisma, studentEnrollmentId, orgId);
  await invalidateEvent("STUDENT_ENROLLMENT_REMOVED", orgId, result.classId, studentEnrollmentId);
  return result;
}

// Seul endedAt est mutable sur une inscription existante : classId et
// studentId sont figés à la création (cf. transferStudentEnrollment pour
// changer un étudiant de classe).
export async function updateStudentEnrollment(
  studentEnrollmentId: string,
  orgId: string,
  data: UpdateStudentEnrollmentDataOutput,
) {
  const result = await tryConstraint(
    prisma.studentEnrollment.update({
      where: { id: studentEnrollmentId, student: { orgId } },
      data: { endedAt: data.endedAt },
      select: { id: true, classId: true },
    }),
  );
  await invalidateEvent("STUDENT_ENROLLMENT_UPDATED", orgId, result.classId, studentEnrollmentId);
  return result;
}

// Changement de classe = clôture + nouvelle inscription, en transaction.
export async function transferStudentEnrollment(
  studentEnrollmentId: string,
  studentId: string,
  newClassId: string,
  orgId: string,
) {
  await assertEnrollmentEligible(prisma, { studentId, classId: newClassId, orgId });

  const { ended, created } = await prisma.$transaction(async (tx) => {
    const ended = await endStudentEnrollmentRaw(tx, studentEnrollmentId, orgId);
    const created = await createStudentEnrollmentRaw(tx, { studentId, classId: newClassId });
    return { ended, created };
  });

  await Promise.all([
    invalidateEvent("STUDENT_ENROLLMENT_REMOVED", orgId, ended.classId, ended.id),
    invalidateEvent("STUDENT_ENROLLMENT_CREATED", orgId, created.classId),
  ]);

  return { ended, created };
}

// Inscription en masse (import direction) : best-effort par étudiant — un
// échec individuel ne doit pas annuler les autres, d'où l'absence de
// transaction globale et un rapport détaillé par studentId (repris du
// comportement V1, mais avec endedAt au lieu de deletedAt : "réactiver" une
// inscription clôturée dans la MÊME classe rouvre endedAt sans jamais muter
// classId, donc sans risque pour l'historique Attendance).
export async function enrollStudentsInClass(
  data: EnrollStudentsInClassOutput,
  orgId: string,
): Promise<EnrollmentMutationResult[]> {
  const studentIds = Array.from(new Set(data.studentIds));
  const results: EnrollmentMutationResult[] = [];

  for (const studentId of studentIds) {
    try {
      await assertEnrollmentEligible(prisma, { studentId, classId: data.classId, orgId });

      const existing = await prisma.studentEnrollment.findUnique({
        where: { studentId_classId: { studentId, classId: data.classId } },
        select: { id: true, endedAt: true },
      });

      if (existing && existing.endedAt === null) {
        results.push({
          studentId,
          status: "skipped",
          enrollmentId: existing.id,
          reason: "Déjà inscrit dans cette classe",
        });
        continue;
      }

      if (existing) {
        const reopened = await reopenStudentEnrollmentRaw(prisma, existing.id, orgId);
        results.push({ studentId, status: "reactivated", enrollmentId: reopened.id });
        continue;
      }

      const created = await createStudentEnrollmentRaw(prisma, { studentId, classId: data.classId });
      results.push({ studentId, status: "created", enrollmentId: created.id });
    } catch (error) {
      results.push({
        studentId,
        status: "failed",
        reason: error instanceof Error ? error.message : "Erreur lors de l'inscription",
      });
    }
  }

  await invalidateEvent("STUDENT_ENROLLMENT_BULK_ENROLLED", orgId, data.classId);
  return results;
}
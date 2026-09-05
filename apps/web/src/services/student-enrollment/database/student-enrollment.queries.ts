import { cacheTag, cacheLife } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE } from "@/cache/server/key";

export interface GetStudentsEnrollmentsFilters {
  classId?: string;
  studentId?: string;
  // Par défaut, seules les inscriptions actives sont retournées (cohérent
  // avec endedAt = "départ en cours d'année, sans casser l'historique").
  includeEnded?: boolean;
}

export async function getStudentsEnrollments(orgId: string, filters: GetStudentsEnrollmentsFilters = {}) {
  "use cache";
  const { classId, studentId, includeEnded = false } = filters;

  cacheTag(CACHE.STUDENT_ENROLLMENT(orgId));
  if (classId) cacheTag(CACHE.STUDENT_ENROLLMENT(orgId, classId));
  if (studentId) cacheTag(CACHE.STUDENT_ENROLLMENT(orgId, studentId));
  cacheLife(CACHE.STUDENT_ENROLLMENT.life);

  return prisma.studentEnrollment.findMany({
    where: {
      student: { orgId },
      ...(classId ? { classId } : {}),
      ...(studentId ? { studentId } : {}),
      ...(includeEnded ? {} : { endedAt: null }),
    },
    select: {
      id: true,
      studentId: true,
      classId: true,
      createdAt: true,
      endedAt: true,
      student: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              avatar_url: true,
            },
          },
        },
      },
      // Nécessaire pour l'UI d'inscription (badges de groupe par étudiant).
      studentGroups: {
        select: {
          id: true,
          group: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudentEnrollmentDetails(studentEnrollmentId: string, orgId: string) {
  "use cache";
  cacheTag(CACHE.STUDENT_ENROLLMENT(orgId, studentEnrollmentId));
  cacheLife(CACHE.STUDENT_ENROLLMENT.life);

  return prisma.studentEnrollment.findFirst({
    where: {
      id: studentEnrollmentId,
      student: { orgId },
    },
    select: {
      id: true,
      studentId: true,
      classId: true,
      createdAt: true,
      endedAt: true,
    },
  });
}

export async function getStudentEnrollmentByClass(studentId: string, classId: string, orgId: string) {
  "use cache";
  cacheTag(CACHE.STUDENT_ENROLLMENT(orgId, studentId));
  cacheTag(CACHE.STUDENT_ENROLLMENT(orgId, classId));
  cacheLife(CACHE.STUDENT_ENROLLMENT.life);

  return prisma.studentEnrollment.findUnique({
    where: {
      studentId_classId: { studentId, classId },
      student: { orgId },
    },
    select: {
      id: true,
      studentId: true,
      classId: true,
      createdAt: true,
      endedAt: true,
    },
  });
}

// Recherche d'étudiants à inscrire dans une classe donnée, avec leur statut
// d'inscription pour CETTE classe (studentEnrollments filtré par classId,
// au plus 1 résultat grâce à la contrainte unique studentId+classId).
//
// Volontairement NON mise en cache ("use cache" absent) : une recherche
// texte libre a un taux de réutilisation quasi nul.
export async function searchStudentsForEnrollment(orgId: string, classId: string, query: string) {
  // Class n'a pas d'orgId direct (scope via academicYear) — vérif obligatoire.
  const targetClass = await prisma.class.findFirst({
    where: { id: classId, deletedAt: null, academicYear: { orgId } },
    select: { id: true },
  });
  if (!targetClass) throw new Error("Classe introuvable");

  return prisma.student.findMany({
    where: {
      orgId,
      deletedAt: null,
      user: {
        deletedAt: null,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
    },
    select: {
      id: true,
      user: {
        select: { firstName: true, lastName: true, email: true, phone: true, avatar_url: true },
      },
      studentEnrollments: {
        where: { classId },
        select: { id: true, endedAt: true },
        take: 1,
      },
    },
    orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
    take: 20,
  });
}
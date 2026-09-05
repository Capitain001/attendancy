import { prisma } from "@/lib/prisma";
import { pickRandom } from "../utils/random";
import { ensureSeedingAllowed } from "../guards/guard";

export interface LinkRandomTeachersToCoursesOptions {
  // Limiter à une classe précise. Sinon, traite tous les cours sans prof de
  // l'org entière.
  classId?: string;
  // false (défaut) : ne cible que les cours sans AUCUN CourseTeacher.
  // true : cible aussi les cours qui ont déjà des co-profs mais pas de
  // responsable (isMain: true) — utile pour compléter un jeu de données
  // partiellement rempli sans dupliquer les affectations existantes.
  onlyMissingMain?: boolean;
}

export interface LinkTeacherResultItem {
  status: "linked" | "skipped" | "failed";
  courseId: string;
  teacherId?: string;
  reason?: string;
}

// Nom composé volontairement conservé ici : la fonction relie deux entités
// distinctes (Course ↔ Teacher), "course-teacher" décrit exactement ça.
export async function linkRandomTeachersToCourses(
  orgId: string,
  options: LinkRandomTeachersToCoursesOptions = {},
): Promise<LinkTeacherResultItem[]> {
  await ensureSeedingAllowed(orgId);

  const teachers = await prisma.teacher.findMany({
    where: { orgId, deletedAt: null },
    select: { id: true },
  });

  if (teachers.length === 0) {
    throw new Error("Aucun enseignant disponible dans cette organisation");
  }

  const unassignedCourses = await prisma.course.findMany({
    where: {
      orgId,
      deletedAt: null,
      ...(options.classId ? { classId: options.classId } : {}),
      teachers: options.onlyMissingMain ? { none: { isMain: true } } : { none: {} },
    },
    select: { id: true },
  });

  const results: LinkTeacherResultItem[] = [];

  for (const course of unassignedCourses) {
    const teacher = pickRandom(teachers);
    if (!teacher) {
      results.push({ status: "skipped", courseId: course.id, reason: "Aucun enseignant disponible" });
      continue;
    }

    try {
      await prisma.courseTeacher.create({
        data: { courseId: course.id, teacherId: teacher.id, isMain: true },
      });
      results.push({ status: "linked", courseId: course.id, teacherId: teacher.id });
    } catch (error) {
      results.push({
        status: "failed",
        courseId: course.id,
        reason: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  return results;
}

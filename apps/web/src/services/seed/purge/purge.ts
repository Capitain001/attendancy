import { prisma } from "@/lib/prisma";
import { seedFilterByBatch, seedFilterAny } from "../tag/tag";

export interface PurgeSeedDataOptions {
  // Si fourni, ne purge que ce batch précis. Sinon, purge TOUTES les
  // données marquées seed=true de l'org — à utiliser avec prudence depuis
  // le panel (prévoir une confirmation explicite côté UI).
  seedBatchId?: string;
}

export interface PurgeSeedDataResult {
  usersDeleted: number;
  enrollmentsDeleted: number;
  parentRelationsDeleted: number;
  courseTeacherLinksDeleted: number;
}

// Ordre de suppression contraint par le schéma : StudentEnrollment,
// ParentRelation et CourseTeacher référencent Student/Parent/Teacher avec
// une contrainte par défaut (Restrict) — les supprimer AVANT les Users, sinon
// le cascade Prisma sur User → Student/Parent/Teacher (onDelete: Cascade)
// échoue au niveau DB dès qu'une de ces tables bloque encore la ligne.
// StudentGroup n'a pas besoin d'être traité ici : il cascade automatiquement
// avec son StudentEnrollment (onDelete: Cascade défini sur ce lien).
//
// Limite connue : si un étudiant/parent/prof seedé a depuis accumulé de la
// vraie activité via l'usage normal de l'app (Attendance, Evaluation,
// Justification...), ces tables ne sont pas nettoyées ici et peuvent bloquer
// la suppression finale des Users avec une erreur de contrainte Prisma —
// volontaire : mieux vaut un échec explicite qu'un état incohérent forcé.
export async function purgeSeedData(orgId: string, options: PurgeSeedDataOptions = {}): Promise<PurgeSeedDataResult> {
  const seedFilter = options.seedBatchId ? seedFilterByBatch(options.seedBatchId) : seedFilterAny();

  const seededUsers = await prisma.user.findMany({
    where: seedFilter,
    select: {
      id: true,
      student: { where: { orgId }, select: { id: true } },
      parent: { where: { orgId }, select: { id: true } },
      teacher: { where: { orgId }, select: { id: true } },
    },
  });

  const seededUserIds = seededUsers.map((u) => u.id);
  const seededStudentIds = seededUsers.flatMap((u) => u.student.map((s) => s.id));
  const seededParentIds = seededUsers.flatMap((u) => u.parent.map((p) => p.id));
  const seededTeacherIds = seededUsers.flatMap((u) => u.teacher.map((t) => t.id));

  const [
    { count: enrollmentsDeleted },
    { count: parentRelationsDeleted },
    { count: courseTeacherLinksDeleted },
  ] = await Promise.all([
    prisma.studentEnrollment.deleteMany({ where: { studentId: { in: seededStudentIds } } }),
    prisma.parentRelation.deleteMany({
      where: { OR: [{ studentId: { in: seededStudentIds } }, { parentId: { in: seededParentIds } }] },
    }),
    // CourseTeacher.teacherId est onDelete: SetNull — sans ce nettoyage
    // explicite, la ligne survivrait avec un teacherId à null au lieu
    // d'être supprimée (pas bloquant, mais laisse des traces orphelines).
    prisma.courseTeacher.deleteMany({ where: { teacherId: { in: seededTeacherIds } } }),
  ]);

  const { count: usersDeleted } = await prisma.user.deleteMany({ where: { id: { in: seededUserIds } } });

  return { usersDeleted, enrollmentsDeleted, parentRelationsDeleted, courseTeacherLinksDeleted };
}

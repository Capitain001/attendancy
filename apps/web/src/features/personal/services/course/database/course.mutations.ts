// src/features/personal/services/course/database/course.mutations.ts
// apps/web/src/features/personal/services/course/database/course.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/graph'
import type { Prisma } from '@/generated/prisma/client'
import { PERSONAL } from '@/features/personal/constants'
import type { CreatePersonalCourseData } from '../types'

type Tx = Prisma.TransactionClient

// ─── Garde (hors transaction) ────────────────────────────────────────────────
// La classe doit appartenir à l'org du prof. null si absente : le throw
// appartient à l'orchestrateur.
function findOrgClass(classId: string, orgId: string) {
  return prisma.class.findFirst({
    where: { id: classId, deletedAt: null, programTrack: { orgId } },
    select: { id: true },
  })
}

// ─── Briques d'écriture (dans la transaction, non exportées) ─────────────────
// Aucune ne gère d'erreur ni de cache : tryConstraint et les invalidations
// appartiennent à createPersonalCourse.

// Chaîne institutionnelle invisible pour le prof :
// UE sentinelle (une par org) → matière du même nom que le cours.
// Même nom dans deux classes = même UECourse réutilisé.
// Sans département : l'abstraction institutionnelle n'a pas de sens ici.
//
// UECourse : unicité PARTIELLE (uecourse_active_name_unique_idx, 30_academic.sql),
// donc pas d'upsert (pas de clé composite Prisma, et il retrouverait une
// matière archivée) : findFirst parmi les ACTIVES, puis create. `order` n'est
// jamais fourni : le trigger fn_uecourse_insert_order le place en fin de liste.
// Création concurrente du même nom → P2002 mappé par tryConstraint.
async function ensurePersonalUECourseTx(tx: Tx, { orgId, name }: { orgId: string; name: string }) {
  const ue = await tx.uE.upsert({
    where: { code_orgId: { code: PERSONAL.NAME, orgId } },
    create: { name: PERSONAL.NAME, code: PERSONAL.NAME, orgId },
    update: {},
    select: { id: true },
  })

  const select = { id: true, name: true, credits: true, duration: true } as const

  const existing = await tx.uECourse.findFirst({
    where: { name, ueId: ue.id, deletedAt: null },
    select,
  })
  if (existing) return existing

  return tx.uECourse.create({ data: { name, ueId: ue.id, orgId }, select })
}

// Le cours, avec le prof comme responsable (CourseTeacher imbriqué).
// credits / durationTotal sont hérités de la matière, comme dans le service
// institutionnel. Un doublon actif (classId, ueCourseId) est refusé par
// l'index partiel course_active_unique_idx (P2002 mappé par tryConstraint).
function createPersonalCourseTx(
  tx: Tx,
  { orgId, classId, teacherId, ueCourse }: {
    orgId: string
    classId: string
    teacherId: string
    ueCourse: { id: string; name: string; credits: number; duration: number }
  },
) {
  return tx.course.create({
    data: {
      name:          ueCourse.name,
      credits:       ueCourse.credits,
      durationTotal: ueCourse.duration,
      ueCourseId:    ueCourse.id,
      classId,
      orgId,
      teachers: { create: { teacherId, isMain: true } },
    },
    select: { id: true, name: true, credits: true },
  })
}

// Groupe VIDE, lié au cours (Group.courseId) et nommé comme lui : le prof
// pourra planifier (Schedule.groupId) uniquement pour ce groupe.
// Ses membres se gèrent ailleurs (setGroupStudents).
function createPersonalGroupTx(
  tx: Tx,
  { classId, courseId, name }: { classId: string; courseId: string; name: string },
) {
  return tx.group.create({
    data: { name, classId, courseId },
    select: { id: true, name: true },
  })
}

// ─── Orchestrateur ───────────────────────────────────────────────────────────
// Crée un cours dans une classe du prof. Rien de plus par défaut.
// `withGroup` : l'APPELANT décide s'il veut aussi un groupe lié au cours.
// Cette fonction ne décide jamais à sa place (pas de lecture du type de classe).
//
// Atomique : si une étape échoue, rien n'est écrit.
export async function createPersonalCourse(
  params: CreatePersonalCourseData & { orgId: string },
) {
  const { orgId, classId, name, teacherId, withGroup = false } = params

  // 1. Garde : la classe appartient bien à l'org du prof.
  const cls = await findOrgClass(classId, orgId)
  if (!cls) throw new Error('Classe introuvable')

  // 2. Écritures, dans UNE transaction.
  const result = await tryConstraint(prisma.$transaction(async (tx) => {
    // 2a. La matière du même nom (et l'UE sentinelle qui la porte).
    const ueCourse = await ensurePersonalUECourseTx(tx, { orgId, name })

    // 2b. Le cours, avec le prof comme responsable.
    const course = await createPersonalCourseTx(tx, { orgId, classId, teacherId, ueCourse })

    // 2c. Le groupe, uniquement si l'appelant l'a demandé.
    const group = withGroup
      ? await createPersonalGroupTx(tx, { classId, courseId: course.id, name: course.name })
      : null

    return { course, group }
  }))

  // 3. Invalidation du cache, APRÈS le commit.
  await Promise.all([
    invalidateEvent('UE_CREATED', orgId),
    // invalidateEvent('UE_COURSE_CREATED', orgId),
    invalidateEvent('COURSE_CREATED', orgId, classId),
    ...(result.group ? [invalidateEvent('GROUP_CREATED', orgId, classId)] : []),
  ])

  return result
}

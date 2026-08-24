// src/services/course/database/course.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateCourseOutput, UpdateCourseDataOutput } from '../validation'

export async function createCourse(data: CreateCourseOutput & { orgId: string }) {
  // Verify class belongs to org
  const cls = await prisma.class.findFirst({
    where: { id: data.classId, deletedAt: null, programTrack: { orgId: data.orgId } },
    select: { id: true },
  })
  if (!cls) throw new Error('Classe introuvable')

  // Get UECourse info to populate course fields
  const ueCourse = await prisma.uECourse.findFirst({
    where: { id: data.ueCourseId, orgId: data.orgId, deletedAt: null },
    select: { name: true, credits: true, duration: true },
  })
  if (!ueCourse) throw new Error('Matière introuvable')

  // Check partial unique index (classId, ueCourseId) WHERE deletedAt IS NULL
  const existing = await prisma.course.findFirst({
    where: { classId: data.classId, ueCourseId: data.ueCourseId, deletedAt: null },
    select: { id: true },
  })
  if (existing) throw new Error('Ce cours existe déjà pour cette classe')

  const result = await tryConstraint(prisma.course.create({
    data: {
      name:          data.name ?? ueCourse.name,
      credits:       ueCourse.credits,
      durationTotal: ueCourse.duration,
      ueCourseId:    data.ueCourseId,
      classId:       data.classId,
      orgId:         data.orgId,
      ...(data.termId ? { termId: data.termId } : {}),
    },
    select: { id: true, name: true, credits: true },
  }))
  await invalidateEvent('COURSE_CREATED', data.orgId, data.classId)
  return result
}


export async function updateCourse(
  courseId: string,
  data: UpdateCourseDataOutput,
  orgId: string,
) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, orgId, deletedAt: null },
    select: { classId: true },
  })
  if (!course) throw new Error('Cours introuvable')

  const result = await prisma.course.update({
    where: { id: courseId },
    data,
    select: { id: true, name: true, description: true },
  })
  await invalidateEvent('COURSE_UPDATED', orgId, course.classId)
  return result
}

export async function removeCourse(courseId: string, orgId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, orgId, deletedAt: null },
    select: { classId: true },
  })
  if (!course) throw new Error('Cours introuvable')

  await prisma.course.update({
    where: { id: courseId },
    data: { deletedAt: new Date() },
  })
  await invalidateEvent('COURSE_REMOVED', orgId, course.classId)
}





/**
 * Génère les cours d'une classe à partir des UE d'un programme (maquette).
 *
 * IDEMPOTENT — rappelable sans écraser : les couples (classId, ueCourseId)
 * déjà présents (actifs, deletedAt: null) sont ignorés silencieusement.
 * Deux niveaux de garantie, comme le reste du produit (cf. PRD §6 M6 —
 * "double garantie anti-conflit") :
 *   1. Pré-filtre applicatif (une requête, pas de boucle N+1) — évite de
 *      générer de la charge DB inutile sur le cas courant (rien à créer).
 *   2. `skipDuplicates: true` sur l'insert final — filet de sécurité contre
 *      une création concurrente survenue ENTRE le pré-filtre et l'insert
 *      (ex. deux générations lancées en parallèle sur la même classe).
 *      Ceci s'appuie sur `ON CONFLICT DO NOTHING` côté Postgres, qui
 *      s'applique à TOUTE violation de contrainte — y compris l'index
 *      partiel `course_active_unique_idx`, alors même que Prisma ne le
 *      connaît pas nativement (pas de @@unique déclaré, cf. 30_academic.sql).
 *      → contrairement à un `create()` par item, cette voie ne lève JAMAIS
 *        de P2002 sur un doublon : le doublon est silencieusement ignoré.
 *
 * Matières archivées : filtrées (`deletedAt: null` sur ueCourses) — une
 * matière retirée de l'offre ne doit pas générer de nouveau cours, même si
 * l'UE parente reste attachée au programme (cf. commentaire academic.prisma
 * sur l'archivage UE : bloque les NOUVELLES attaches, pas l'historique).
 *
 * termsBySemester (optionnel) : map ProgramUE.semester → Term.id de CETTE
 * classe, pour lier chaque cours généré à sa période dès la création. Sans
 * cette map, les cours sont créés avec termId = null (rattachable plus
 * tard). Résolution du mapping volontairement laissée à l'appelant — cette
 * fonction ne résout pas une donnée qu'elle peut recevoir en props
 * (SERVICE_CONTEXT.md §4).
 *
 * Multi-tenant : classId ET programId sont vérifiés comme appartenant à
 * orgId avant toute lecture des UE — un programId d'une autre org échoue
 * proprement plutôt que de fuiter silencieusement (R1 du PRD).
 */
export async function generateCoursesFromProgram({
  programId,
  classId,
  orgId,
  termsBySemester,
}: {
  programId: string
  classId: string
  orgId: string
  termsBySemester?: Record<number, string>
}) {
  const [cls, program] = await Promise.all([
    prisma.class.findFirst({
      where: { id: classId, deletedAt: null, programTrack: { orgId } },
      select: { id: true },
    }),
    prisma.program.findFirst({
      where: { id: programId, orgId, deletedAt: null },
      select: { id: true },
    }),
  ])
  if (!cls) throw new Error('Classe introuvable')
  if (!program) throw new Error('Programme introuvable')

  const programUEs = await prisma.programUE.findMany({
    where: { programId },
    select: {
      semester: true,
      ue: {
        select: {
          ueCourses: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' },
            select: { id: true, name: true, credits: true, duration: true },
          },
        },
      },
    },
  })
  if (programUEs.length === 0) return { created: [], skippedCount: 0 }

  // Aplatit : chaque UECourse hérite du semestre structurel de sa position
  // dans le programme (ProgramUE.semester)
  const candidates = programUEs.flatMap(({ semester, ue }) =>
    ue.ueCourses.map((ueCourse) => ({ ...ueCourse, semester })),
  )
  if (candidates.length === 0) return { created: [], skippedCount: 0 }

  // Pré-filtre : cours déjà présents pour cette classe (actifs uniquement —
  // un cours soft-deleté libère la clé, cf. course_active_unique_idx)
  const existing = await prisma.course.findMany({
    where: {
      classId,
      deletedAt: null,
      ueCourseId: { in: candidates.map((c) => c.id) },
    },
    select: { ueCourseId: true },
  })
  const existingIds = new Set(existing.map((c) => c.ueCourseId))
  const toCreate = candidates.filter((c) => !existingIds.has(c.id))

  if (toCreate.length === 0) {
    return { created: [], skippedCount: candidates.length }
  }

  const created = await tryConstraint(
    prisma.course.createManyAndReturn({
      data: toCreate.map((c) => ({
        name:          c.name,
        credits:       c.credits,
        durationTotal: c.duration,
        ueCourseId:    c.id,
        classId,
        orgId,
        ...(termsBySemester?.[c.semester] ? { termId: termsBySemester[c.semester] } : {}),
      })),
      skipDuplicates: true,
      select: { id: true, name: true, credits: true, ueCourseId: true },
    }),
  )

  await invalidateEvent('COURSE_CREATED', orgId, classId)

  return { created, skippedCount: candidates.length - created.length }
}
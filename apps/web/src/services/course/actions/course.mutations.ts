'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createCourseSchema, updateCourseSchema } from '../validation'
import type { CreateCourseInput, UpdateCourseInput } from '../validation'
import { createCourse, removeCourse, updateCourse } from '../database'

export async function createCourseAction(input: CreateCourseInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createCourseSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await createCourse({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateCourseAction(input: UpdateCourseInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(updateCourseSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await updateCourse(parsed.output.courseId, parsed.output.data, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeCourseAction(courseId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await removeCourse(courseId, orgId)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}



// ─────────────────────────────────────────────────────────────────────────────
// À AJOUTER dans src/services/course/actions/course.mutations.ts (à la suite
// de createCourseAction — mêmes imports 'use server' / v / authAccess déjà en
// tête de fichier, ne pas les dupliquer)
// ─────────────────────────────────────────────────────────────────────────────
//
// Écart volontaire par rapport à l'exemple minimal du skill (createEntityAction
// sans try/catch) : generateCoursesFromProgram peut lever une Error "brute"
// ('Classe introuvable', 'Programme introuvable' — pas seulement des erreurs
// tryConstraint) AVANT même d'atteindre Prisma. Sans try/catch ici, cette
// exception remonterait non catchée hors du contrat ApiResponse<T> ({ data } /
// { error }) que tout le reste du service respecte — cf. constants.ts.
//
// Rôle requis : DIRECTION, par analogie avec "Gérer référentiel académique"
// (PRD §10, réservé Direction — l'Admin n'atteint jamais l'académique). À
// confirmer si un autre rôle/fonction (ex. "Scolarité") doit aussi y accéder.

import { generateCoursesFromProgramSchema } from '../validation'
import type { GenerateCoursesFromProgramInput } from '../validation'
import { generateCoursesFromProgram } from '../database'

export async function generateCoursesFromProgramAction(input: GenerateCoursesFromProgramInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(generateCoursesFromProgramSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  // parsed.output: GenerateCoursesFromProgramOutput

  try {
    const result = await generateCoursesFromProgram({ ...parsed.output, orgId })
    return { data: result }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
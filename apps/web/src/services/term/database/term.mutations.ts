// src/services/term/database/term.mutations.ts
import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/key'
import { tryConstraint } from '@/utils/server/prisma'
import { ERRORS } from '@/config'
import { termSelect } from './term.queries'
import type { CreateTermData, UpdateTermData } from '../types'
import { cache } from 'react'


// Vérifie que le semestre appartient bien à l'org (Term n'a pas d'orgId
// direct — scope via Class → ProgramTrack, comme les queries).
export const findOwnedTerm = cache(async (termId: string, orgId: string) => {
  return prisma.term.findFirst({
    where: { 
      id: termId, 
      class: { 
        deletedAt: null, 
        programTrack: { orgId } 
      } 
    },
    select: { id: true, classId: true, lockedAt: true },
  })
})




// Utilisation de `cache` pour mémoïser le résultat par arguments (termId, orgId)

/** Crée un semestre pour une classe — vérifie l'appartenance org avant écriture. */
export async function createTerm(data: CreateTermData, orgId: string) {
  const class_ = await prisma.class.findFirst({
    where: { id: data.classId, deletedAt: null, programTrack: { orgId } },
    select: { id: true },
  })
  if (!class_) throw new Error(ERRORS.DB.NOT_FOUND)

  const term = await tryConstraint(
    prisma.term.create({ data, select: termSelect })
  )

  await invalidateEvent('TERM_CREATED', orgId, data.classId)
  return term
}

/**
 * Met à jour un semestre. Un semestre clôturé (lockedAt) est figé — R7 :
 * toute correction post-clôture passe par ApprovalRequest, pas par cette fn.
 */
export async function updateTerm(termId: string, orgId: string, data: UpdateTermData) {
  const existing = await findOwnedTerm(termId, orgId)
  if (!existing) throw new Error(ERRORS.DB.NOT_FOUND)
  if (existing.lockedAt) throw new Error('Semestre clôturé : modification impossible.')

  const term = await tryConstraint(
    prisma.term.update({ where: { id: termId }, data, select: termSelect })
  )

  await invalidateEvent('TERM_UPDATED', orgId, existing.classId)
  return term
}

/**
 * Supprime un semestre. Term n'a pas de soft delete (pas de deletedAt) —
 * hard delete assumé : Course.termId est nullable + onDelete SetNull, donc
 * aucune perte de cours, seulement du rattachement au semestre.
 * Refusé si clôturé (même logique que updateTerm).
 */
export async function removeTerm(termId: string, orgId: string) {
  const existing = await findOwnedTerm(termId, orgId)
  if (!existing) throw new Error(ERRORS.DB.NOT_FOUND)
  if (existing.lockedAt) throw new Error('Semestre clôturé : suppression impossible.')

  await tryConstraint(prisma.term.delete({ where: { id: termId } }))

  await invalidateEvent('TERM_REMOVED', orgId, existing.classId)
  return { id: termId, classId: existing.classId }
}

// ─────────────────────────────────────────────────────────────────────────────
// Génération automatique des semestres d'une classe depuis son programme.
// ─────────────────────────────────────────────────────────────────────────────

export async function generateTermsFromProgram(classId: string, orgId: string) {
  const class_ = await prisma.class.findFirst({
    where: { id: classId, deletedAt: null, programTrack: { orgId } },
    select: { programId: true, terms: { select: { order: true } } },
  })
  if (!class_?.programId) throw new Error('Aucun programme attaché à cette classe')

  const existingOrders = new Set(class_.terms.map((t) => t.order))

  const programUEs = await prisma.programUE.findMany({
    where: { programId: class_.programId },
    select: { semester: true },
    distinct: ['semester'],
    orderBy: { semester: 'asc' },
  })

  const semesters = programUEs.map((p) => p.semester).filter((s) => !existingOrders.has(s))
  if (semesters.length === 0) return []

  const results = await tryConstraint(
    prisma.$transaction(
      semesters.map((s) =>
        prisma.term.create({
          data: { classId, order: s, name: `Semestre ${s}` },
          select: termSelect,
        })
      )
    )
  )

  await invalidateEvent('TERM_GENERATED', orgId, classId)
  return results
}
// src/services/term/database/term.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

// Select partagé queries + mutations (retour homogène pour les DTOs).
export const termSelect = {
  id: true,
  classId: true,
  order: true,
  name: true,
  startDate: true,
  endDate: true,
  lockedAt: true,
  createdAt: true,
  updatedAt: true,
} as const

/** Semestres d'une classe, triés par ordre structurel. Scope org via Class → ProgramTrack. */
export async function getTerms(classId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.TERM(orgId), CACHE.TERM(orgId, classId))
  cacheLife(CACHE.TERM.life)

  return prisma.term.findMany({
    where: {
      classId,
      class: { deletedAt: null, programTrack: { orgId } },
    },
    orderBy: { order: 'asc' },
    select: termSelect,
  })
}

/** Un semestre par id, scope org via Class → ProgramTrack. */
export async function getTerm(termId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.TERM(orgId, termId))
  cacheLife(CACHE.TERM.life)

  return prisma.term.findFirst({
    where: {
      id: termId,
      class: { deletedAt: null, programTrack: { orgId } },
    },
    select: termSelect,
  })
}

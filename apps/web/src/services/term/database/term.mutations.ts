// src/services/term/database/term.mutations.ts
// Génération automatique des semestres d'une classe depuis son programme.
import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/key'

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

  const results = await prisma.$transaction(
    semesters.map((s) =>
      prisma.term.create({
        data: { classId, order: s, name: `Semestre ${s}` },
        select: { id: true, name: true, order: true },
      })
    )
  )
  await invalidateEvent('TERM_GENERATED', orgId, classId)
  return results
}

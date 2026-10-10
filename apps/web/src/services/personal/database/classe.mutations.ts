// src/services/personal/database/classe.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/graph'
import type { Prisma } from '@/generated/prisma/client'
import { PERSONAL } from '../constants'
import type { CreatePersonalClassOutput } from '../validation'

type Tx = Prisma.TransactionClient

/**
 * Cœur transactionnel : AcademicYear → Department → ProgramTrack → Class.
 *
 * Composable dans une transaction existante (ex. création de l'espace perso).
 * Volontairement SANS tryConstraint ni invalidateEvent : ils appartiennent à
 * l'appelant, une fois la transaction externe commitée.
 *
 * Les trois upserts sont idempotents ; `class.create` ne l'est PAS — ne jamais
 * rappeler cette fonction hors d'un contexte « première création » ou d'une
 * création explicite de classe.
 */
export async function createPersonalClassTx(tx: Tx, { orgId, name }: { orgId: string; name: string }) {
    const academicYear = await tx.academicYear.upsert({
        where: { name_orgId: { name: PERSONAL.NAME, orgId } },
        create: { ...PERSONAL.ACADEMIC_YEAR, name: PERSONAL.NAME, orgId },
        update: { isActive: true, isCurrent: true },
        select: { id: true },
    })

    const department = await tx.department.upsert({
        where: { name_orgId: { name: PERSONAL.NAME, orgId } },
        create: { name: PERSONAL.NAME, orgId },
        update: {},
        select: { id: true },
    })

    const programTrack = await tx.programTrack.upsert({
        where: { name_departmentId: { name: PERSONAL.NAME, departmentId: department.id } },
        create: { name: PERSONAL.NAME, departmentId: department.id, orgId },
        update: {},
        select: { id: true },
    })

    return tx.class.create({
        data: {
            name,
            level: 'L1',
            programTrackId: programTrack.id,
            academicYearId: academicYear.id,
        },
        select: { id: true, name: true },
    })
}

// À appeler APRÈS le commit de la transaction qui a appelé createPersonalClassTx.
export function invalidatePersonalClassEvents(orgId: string) {
    return Promise.all([
        invalidateEvent('ACADEMIC_YEAR_CREATED', orgId),
        invalidateEvent('CLASS_CREATED', orgId),
        invalidateEvent('PROGRAM_TRACK_CREATED', orgId),
        invalidateEvent('DEPARTMENT_CREATED', orgId),
    ])
}

// Création autonome (action createPersonalClassAction) : transaction + invalidation.
export async function createPersonalClass(params: CreatePersonalClassOutput & { orgId: string }) {
    const { orgId, name } = params

    const result = await tryConstraint(
        prisma.$transaction((tx) => createPersonalClassTx(tx, { orgId, name })),
    )

    await invalidatePersonalClassEvents(orgId)
    return result
}
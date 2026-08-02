// src/services/ue/database/ue.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateUEOutput } from '../validation'
import type { UEOrder, CourseOrder } from '../validation'

// Ré-export depuis la couche database de program-track (jamais depuis actions/,
// voir SKILL.md service-module-pattern — "un service peut importer les fonctions
// database/ d'un autre service, mais uniquement depuis sa propre couche database/").
export { addUEToProgram } from '@/services/program-track/database'

export type UpdateUEData = {
  name?: string
  code?: string
  description?: string
  departmentId?: string | null
  isOptional?: boolean
}

export async function createUE(data: CreateUEOutput & { orgId: string }) {
  const result = await tryConstraint(
    prisma.uE.create({
      data: {
        name:         data.name,
        code:         data.code ?? null,
        description:  data.description ?? null,
        departmentId: data.departmentId ?? null,
        isOptional:   data.isOptional,
        orgId:        data.orgId,
      },
      select: { id: true, name: true, code: true },
    })
  )
  await invalidateEvent('UE_CREATED', data.orgId)
  return result
}

export async function updateUE(ueId: string, orgId: string, data: UpdateUEData) {
  const result = await tryConstraint(
    prisma.uE.update({
      where: { id: ueId, orgId, deletedAt: null },
      data,
      select: { id: true, name: true, code: true, description: true, departmentId: true, isOptional: true },
    })
  )
  // Fix : c'était 'UE_CREATED' — event dédié UE_UPDATED (ajouté dans cache.ts)
  await invalidateEvent('UE_UPDATED', orgId)
  return result
}

export async function reorderProgram(
  programId: string,
  orgId: string,
  ueOrders: UEOrder[],
  courseOrders: CourseOrder[],
) {
  await prisma.$transaction([
    ...ueOrders.map(({ programUEId, semester, order }) =>
      prisma.programUE.updateMany({
        where: { id: programUEId, program: { orgId } },
        data: { semester, order },
      })
    ),
    ...courseOrders.map(({ ueCourseId, order }) =>
      prisma.uECourse.updateMany({
        where: { id: ueCourseId, orgId },
        data: { order },
      })
    ),
  ])
  const program = await prisma.program.findFirst({
    where: { id: programId, orgId },
    select: { programTrackId: true },
  })
  if (program) await invalidateEvent('PROGRAM_UE_UPDATED', orgId, program.programTrackId)
}

// remove* = soft delete (convention SKILL.md) — archiveUEAction l'expose sous le nom domaine
export async function removeUE(ueId: string, orgId: string) {
  const result = await tryConstraint(
    prisma.uE.update({
      where: { id: ueId, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { id: true },
    })
  )
  await invalidateEvent('UE_ARCHIVED', orgId, ueId)
  return result
}
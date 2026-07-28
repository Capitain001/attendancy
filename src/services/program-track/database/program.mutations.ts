// src/services/program-track/database/program.mutations.ts
import { prisma } from '@/lib/db'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateProgramOutput, AddUEToProgramOutput } from '../validation'

export async function createProgram(data: CreateProgramOutput & { orgId: string }) {
  const result = await tryConstraint(
    prisma.program.create({
      data: {
        name:           data.name,
        description:    data.description ?? null,
        programTrackId: data.programTrackId,
        orgId:          data.orgId,
      },
      select: { id: true, name: true, programTrackId: true },
    })
  )
  await invalidateEvent('PROGRAM_CREATED', data.orgId, result.programTrackId)
  return result
}

export async function addUEToProgram(data: AddUEToProgramOutput & { orgId: string }) {
  // Resolve programTrackId for cache invalidation
  const program = await prisma.program.findFirst({
    where: { id: data.programId, orgId: data.orgId },
    select: { programTrackId: true },
  })
  if (!program) throw new Error('Programme introuvable')

  const result = await tryConstraint(
    prisma.programUE.create({
      data: { programId: data.programId, ueId: data.ueId, semester: data.semester },
      select: { id: true, semester: true, order: true },
    })
  )
  await invalidateEvent('PROGRAM_UE_UPDATED', data.orgId, program.programTrackId)
  return result
}

export async function removeUEFromProgramByComposite(programId: string, ueId: string, orgId: string) {
  const program = await prisma.program.findFirst({
    where: { id: programId, orgId },
    select: { programTrackId: true },
  })
  if (!program) throw new Error('Programme introuvable')

  const { count } = await prisma.programUE.deleteMany({
    where: { programId, ueId, program: { orgId } },
  })
  if (count > 0) await invalidateEvent('PROGRAM_UE_UPDATED', orgId, program.programTrackId)
  return { count }
}

export async function removeUEFromProgram(programUEId: string, orgId: string) {
  // findFirst to verify org ownership (ProgramUE has no direct orgId)
  const pue = await prisma.programUE.findFirst({
    where: { id: programUEId },
    select: { id: true, program: { select: { orgId: true, programTrackId: true } } },
  })
  if (!pue || pue.program.orgId !== orgId) throw new Error('Matière introuvable')

  await tryConstraint(
    prisma.programUE.delete({
      where: { id: programUEId },
      select: { id: true },
    })
  )
  await invalidateEvent('PROGRAM_UE_UPDATED', orgId, pue.program.programTrackId)
}

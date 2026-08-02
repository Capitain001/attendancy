// src/services/program/database/program.mutations.ts
import { prisma } from '@/lib/prisma'
import { Program } from '@/generated/prisma/client'
import { invalidateEvent } from '@/cache/server/key'
import { tryConstraint } from '@/utils/server/prisma'
import { PROGRAM_GRAPH } from '../cache'

export type AddProgramData = Pick<Program, 'name' | 'description' | 'programTrackId'> & {
  classId?: string
}
export type UpdateProgramData = Partial<Pick<Program, 'name' | 'description' | 'programTrackId'>> & {
  classId?: string
}

export async function createProgram({
  data,
  orgId,
}: {
  data: AddProgramData
  orgId: string
}) {
  const program = await tryConstraint(
    prisma.program.create({
      data: {
        name: data.name,
        description: data.description,
        programTrackId: data.programTrackId,
        orgId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        programTrackId: true,
        classes: {
          select: {
            id: true,
            name: true,
            programTrack: { select: { id: true, name: true } },
            academicYear: { select: { id: true, name: true } },
          },
        },
        programTrack: {
          select: {
            id: true,
            name: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    })
  )

  if (data.classId) {
    await prisma.class.update({
      where: { id: data.classId },
      data: { programId: program.id },
    })
    await invalidateEvent("PROGRAM_UPDATED", orgId, data.classId)
  }

  await invalidateEvent("PROGRAM_CREATED", orgId)
  return program
}

export async function updateProgram(
  { programId, orgId }: { programId: string; orgId: string },
  data: UpdateProgramData
) {
  const { classId, ...programData } = data

  const program = await tryConstraint(
    prisma.program.update({
      where: { id: programId },
      data: programData,
      select: {
        id: true,
        name: true,
        description: true,
        programTrackId: true,
        classes: {
          select: {
            id: true,
            name: true,
            programTrack: { select: { id: true, name: true } },
            academicYear: { select: { id: true, name: true } },
          },
        },
        programTrack: {
          select: {
            id: true,
            name: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    })
  )

  if (classId) {
    await prisma.class.update({
      where: { id: classId },
      data: { programId },
    })
    await invalidateEvent("PROGRAM_UPDATED", orgId, classId)
  }

  await invalidateEvent("PROGRAM_UPDATED", orgId, programId)
  return program
}

export async function removeProgram({
  programId,
  orgId,
}: {
  programId: string
  orgId: string
}) {
  const result = await tryConstraint(
    prisma.program.update({
      where: { id: programId, orgId },
      data: { deletedAt: new Date() },
      select: { id: true },
    })
  )
  await invalidateEvent("PROGRAM_DELETED", orgId, programId)
  return result
}
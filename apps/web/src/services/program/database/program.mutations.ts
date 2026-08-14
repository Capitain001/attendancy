// src/services/program/database/program.mutations.ts
import { prisma } from '@/lib/prisma'
import { Program } from '@/generated/prisma/client'
import { invalidateEvent } from '@/cache/server/key'
import { tryConstraint } from '@/utils/server/prisma'
import { PROGRAM_GRAPH } from '../cache'
import type { CreateProgramOutput, UpdateProgramDataOutput } from '../validation'

export async function createProgram({
  data,
  orgId,
}: {
  data: CreateProgramOutput
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
  data: UpdateProgramDataOutput
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
  const program = await prisma.program.findUnique({
    where: { id: programId, orgId },
    include: { classes: { select: { id: true } } }
  })
  if (program && program.classes.length > 0) {
    throw new Error("Impossible de supprimer ce programme car il est lié à des classes existantes.")
  }

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

export async function toggleProgramLock({
  programId,
  orgId,
  isLocked,
}: {
  programId: string
  orgId: string
  isLocked: boolean
}) {
  const result = await tryConstraint(
    prisma.program.update({
      where: { id: programId, orgId },
      data: { isLocked },
      select: { id: true, isLocked: true },
    })
  )
  await invalidateEvent("PROGRAM_UPDATED", orgId, programId)
  return result
}

export async function toggleProgramActive({
  programId,
  orgId,
  isActive,
}: {
  programId: string
  orgId: string
  isActive: boolean
}) {
  const result = await tryConstraint(
    prisma.program.update({
      where: { id: programId, orgId },
      data: { isActive },
      select: { id: true, isActive: true },
    })
  )
  await invalidateEvent("PROGRAM_UPDATED", orgId, programId)
  return result
}

export async function duplicateProgram({
  programId,
  orgId,
  newName,
  programTrackId,
}: {
  programId: string
  orgId: string
  newName: string
  programTrackId: string
}) {
  const sourceProgram = await prisma.program.findUniqueOrThrow({
    where: { id: programId, orgId },
    include: {
      programUEs: true,
    },
  })

  const newProgram = await tryConstraint(
    prisma.program.create({
      data: {
        name: newName,
        description: sourceProgram.description,
        programTrackId,
        orgId,
        isActive: false,
        isLocked: false,
        programUEs: {
          create: sourceProgram.programUEs.map((pUe) => ({
            ueId: pUe.ueId,
            semester: pUe.semester,
            order: pUe.order,
            isCompleted: pUe.isCompleted,
            isOptional: pUe.isOptional,
          })),
        },
      },
      select: { id: true },
    })
  )

  await invalidateEvent('PROGRAM_CREATED', orgId)
  return newProgram
}
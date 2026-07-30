// src/services/program/database/index.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE, invalidateEvent } from '@/cache/server/key'
import { tryConstraint } from '@/utils/server/prisma'

// ─── Types ───────────────────────────────────────────────────────────────────

export type AddProgramData = {
  name: string
  description?: string
  programTrackId: string
  classId?: string
}

export type UpdateProgramData = {
  name?: string
  description?: string
  programTrackId?: string
  classId?: string
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPrograms({
  orgId,
  classId,
  programTrackId,
}: {
  orgId: string
  classId?: string
  programTrackId?: string
}) {
  'use cache'
  cacheTag(CACHE.PROGRAM_TRACK(orgId))
  cacheLife(CACHE.PROGRAM_TRACK.life)
  return prisma.program.findMany({
    where: {
      orgId,
      deletedAt: null,
      ...(classId ? { classes: { some: { id: classId } } } : {}),
      ...(programTrackId ? { programTrackId } : {}),
    },
    select: {
      id:          true,
      name:        true,
      description: true,
      programTrack: {
        select: {
          id:   true,
          name: true,
          department: { select: { id: true, name: true } },
        },
      },
      classes: {
        select: {
          id:   true,
          name: true,
          academicYear: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createProgram({ data, orgId }: { data: AddProgramData; orgId: string }) {
  const result = await tryConstraint(
    prisma.program.create({
      data: {
        name:           data.name,
        description:    data.description ?? null,
        programTrackId: data.programTrackId,
        orgId,
      },
      select: {
        id:          true,
        name:        true,
        description: true,
        programTrack: {
          select: {
            id:   true,
            name: true,
            department: { select: { id: true, name: true } },
          },
        },
        classes: { select: { id: true, name: true, academicYear: { select: { id: true, name: true } } } },
      },
    })
  )
  await invalidateEvent('PROGRAM_CREATED', orgId, result.programTrack.id)
  return result
}

export async function updateProgram(
  { programId, orgId }: { programId: string; orgId: string },
  data: UpdateProgramData
) {
  const { classId, ...programData } = data

  const result = await tryConstraint(
    prisma.program.update({
      where: { id: programId, orgId },
      data:  programData,
      select: {
        id:          true,
        name:        true,
        description: true,
        programTrack: {
          select: {
            id:   true,
            name: true,
            department: { select: { id: true, name: true } },
          },
        },
        classes: { select: { id: true, name: true, academicYear: { select: { id: true, name: true } } } },
      },
    })
  )
  await invalidateEvent('PROGRAM_CREATED', orgId, result.programTrack.id)
  return result
}

export async function deleteProgram({ programId, orgId }: { programId: string; orgId: string }) {
  const existing = await prisma.program.findFirst({
    where: { id: programId, orgId },
    select: { programTrackId: true },
  })
  if (!existing) throw new Error('Programme introuvable')

  await prisma.program.update({
    where: { id: programId },
    data:  { deletedAt: new Date() },
  })
  await invalidateEvent('PROGRAM_CREATED', orgId, existing.programTrackId)
}

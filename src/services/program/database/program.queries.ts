// src/services/program/database/program.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

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
  cacheTag(CACHE.PROGRAM(orgId))
  if (classId) cacheTag(CACHE.CLASS(classId))
  if (programTrackId) cacheTag(CACHE.PROGRAM_TRACK(programTrackId))
  cacheLife(CACHE.PROGRAM.life)

  return prisma.program.findMany({
    where: {
      orgId,
      deletedAt: null,
      ...(classId ? { classes: { some: { id: classId } } } : {}),
      ...(programTrackId ? { programTrackId } : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      classes: {
        select: {
          id: true,
          name: true,
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
    orderBy: { name: 'asc' },
  })
}

export async function getProgramById({
  orgId,
  programId,
}: {
  orgId: string
  programId: string
}) {
  'use cache'
  cacheTag(CACHE.PROGRAM(orgId))
  cacheTag(CACHE.PROGRAM(orgId, programId))
  cacheLife(CACHE.PROGRAM.life)

  return prisma.program.findFirst({
    where: { id: programId, orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      description: true,
      programTrack: {
        select: {
          id: true,
          name: true,
          department: { select: { id: true, name: true } },
        },
      },
      classes: {
        select: {
          id: true,
          name: true,
          level: true,
          academicYear: { select: { id: true, name: true } },
        },
      },
    },
  })
}

export async function getProgramList({
  orgId,
  classId,
  programTrackId,
}: {
  orgId: string
  classId?: string
  programTrackId?: string
}) {
  'use cache'
  cacheTag(CACHE.PROGRAM(orgId))
  if (classId) cacheTag(CACHE.CLASS(classId))
  if (programTrackId) cacheTag(CACHE.PROGRAM_TRACK(programTrackId))
  cacheLife(CACHE.PROGRAM.life)

  return prisma.program.findMany({
    where: {
      orgId,
      deletedAt: null,
      ...(classId ? { classes: { some: { id: classId } } } : {}),
      ...(programTrackId ? { programTrackId } : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      _count: { select: { classes: true } },
      programTrack: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getClassProgram({ classId }: { classId: string }) {
  'use cache'
  cacheTag(CACHE.CLASS(classId))
  cacheLife(CACHE.PROGRAM.life)

  return prisma.class.findUnique({
    where: { id: classId },
    select: {
      name: true,
      level: true,
      programTrack: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
      program: { select: { id: true, name: true, description: true } },
    },
  })
}
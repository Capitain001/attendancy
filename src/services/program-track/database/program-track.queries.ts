// src/services/program-track/database/program-track.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getProgramTracks(orgId: string) {
  'use cache'
  cacheTag(CACHE.PROGRAM_TRACK(orgId))
  cacheLife(CACHE.PROGRAM_TRACK.life)
  return prisma.programTrack.findMany({
    where: { orgId },
    select: {
      id: true,
      name: true,
      description: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
      _count: { select: { classes: true, programs: true } },
    },
    orderBy: { name: 'asc' },
  })
}

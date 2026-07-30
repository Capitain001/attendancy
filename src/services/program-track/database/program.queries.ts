// src/services/program-track/database/program.queries.ts
// Program et ProgramUE sont des sous-entités structurelles de ProgramTrack.
// Exception documentée dans CLAUDE.md — séparés en services distincts si Program acquiert
// une page propre ou des mutations indépendantes de ProgramTrack.
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getProgramsByTrack(programTrackId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.PROGRAM_TRACK(orgId))
  cacheTag(CACHE.PROGRAM_TRACK(orgId, programTrackId))
  cacheLife(CACHE.PROGRAM_TRACK.life)
  return prisma.program.findMany({
    where: { programTrackId, orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      programUEs: {
        select: {
          id: true,
          semester: true,
          order: true,
          isOptional: true,
          ue: { select: { id: true, name: true, code: true } },
        },
        orderBy: [{ semester: 'asc' }, { order: 'asc' }],
      },
    },
    orderBy: { name: 'asc' },
  })
}

// src/services/program-track/database/program-track.mutations.ts
import { prisma } from '@/lib/db'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateProgramTrackOutput } from '../validation'

export async function createProgramTrack(data: CreateProgramTrackOutput & { orgId: string }) {
  const result = await tryConstraint(
    prisma.programTrack.create({
      data: {
        name:         data.name,
        description:  data.description ?? null,
        departmentId: data.departmentId,
        orgId:        data.orgId,
      },
      select: { id: true, name: true },
    })
  )
  await invalidateEvent('PROGRAM_TRACK_CREATED', data.orgId)
  return result
}

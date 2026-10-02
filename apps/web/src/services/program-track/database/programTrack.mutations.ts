// src/services/program-track/database/programTrack.mutations.ts
import { prisma } from "@/lib/prisma";
import { invalidateEvent } from '@/cache/server/graph';
import type { AddProgramTrackData, UpdateProgramTrackData } from "./programTrack.queries";

export async function createProgramTrack({ data, orgId }: { data: AddProgramTrackData; orgId: string }) {
  const programTrack = await prisma.programTrack.create({
    data: { ...data, orgId },
    select: { id: true, name: true, departmentId: true, description: true },
  });
  await invalidateEvent('PROGRAM_TRACK_CREATED', orgId)
  return programTrack;
}


export async function updateProgramTrack(
  { programTrackId, orgId }: { programTrackId: string; orgId: string },
  data: UpdateProgramTrackData
) {
  const updated = await prisma.programTrack.update({
    where: { id: programTrackId },
    data,
    select: { id: true, name: true, departmentId: true, description: true },
  });
  await invalidateEvent('PROGRAM_TRACK_UPDATED', orgId, programTrackId)
  return updated;
}

export async function deleteProgramTrack({ programTrackId, orgId }: { programTrackId: string; orgId: string }) {
  await prisma.programTrack.delete({ where: { id: programTrackId } });
  await invalidateEvent('PROGRAM_TRACK_DELETED', orgId, programTrackId)
}

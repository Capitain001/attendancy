import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/config/cache";
import type { AddProgramTrackData, UpdateProgramTrackData } from "./programTrack.queries";

export async function createProgramTrack({ data, orgId }: { data: AddProgramTrackData; orgId: string }) {
  const programTrack = await prisma.programTrack.create({
    data: { ...data, orgId },
    select: { id: true, name: true, departmentId: true, description: true },
  });
  await invalidateCache("PROGRAM_TRACK", orgId);
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
  await invalidateCache("PROGRAM_TRACK", orgId);
  return updated;
}

export async function deleteProgramTrack({ programTrackId, orgId }: { programTrackId: string; orgId: string }) {
  await prisma.programTrack.delete({ where: { id: programTrackId } });
  await invalidateCache("PROGRAM_TRACK", orgId);
}

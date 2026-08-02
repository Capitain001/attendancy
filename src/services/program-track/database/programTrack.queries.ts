import { prisma } from "@/lib/prisma";
import { ProgramTrack } from "@/generated/prisma/client";
import { unstable_cache } from "next/cache";
import { CACHE } from "@/config/cache";

export type AddProgramTrackData = Pick<ProgramTrack, "name" | "departmentId">;
export type UpdateProgramTrackData = Partial<AddProgramTrackData>;

export function getProgramTracks({ orgId, departmentId }: { orgId: string; departmentId?: string }) {
  return unstable_cache(
    async () => {
      return prisma.programTrack.findMany({
        where: { orgId, ...(departmentId ? { departmentId } : {}) },
        select: {
          id: true,
          name: true,
          department: { select: { id: true, name: true } },
          description: true,
          _count: { select: { classes: true } },
        },
        orderBy: [{ name: "asc" }],
      });
    },
    ["programTrack", orgId, departmentId || "all"],
    { revalidate: 300, tags: [CACHE.PROGRAM_TRACK(orgId)] }
  )();
}

export function getProgramTracksBasic({ orgId, departmentId }: { orgId: string; departmentId?: string }) {
  return unstable_cache(
    async () => {
      return prisma.programTrack.findMany({
        where: { orgId, ...(departmentId ? { departmentId } : {}) },
        select: { id: true, name: true, departmentId: true, description: true },
        orderBy: [{ name: "asc" }],
      });
    },
    ["programTrackBasic", orgId, departmentId || "all"],
    { revalidate: 300, tags: [CACHE.PROGRAM_TRACK(orgId)] }
  )();
}

export function getProgramTrack({ programTrackId, orgId }: { programTrackId: string; orgId: string }) {
  return unstable_cache(
    async () => {
      return prisma.programTrack.findFirst({
        where: { id: programTrackId, orgId },
        select: {
          id: true,
          name: true,
          description: true,
          department: { select: { id: true, name: true } },
          _count: { select: { classes: true } },
        },
      });
    },
    ["programTrack", orgId, programTrackId],
    { revalidate: 300, tags: [CACHE.PROGRAM_TRACK(orgId)] }
  )();
}

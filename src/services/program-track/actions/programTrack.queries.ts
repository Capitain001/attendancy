"use server";

import { getUserInfo } from "@/services/user";
import { ERRORS } from "@/config";
import { getProgramTracks, getProgramTracksBasic, getProgramTrack } from "../database";
import { groupProgramTracksByDepartment } from "../utils";

export async function getProgramTracksAction({ departmentId }: { departmentId?: string }) {
  try {
    const user = await getUserInfo();
    if (!user) throw new Error(ERRORS.AUTH.UNAUTHORIZED);

    const orgId = user.organization?.id;
    if (!orgId) throw new Error(ERRORS.ORG.NOT_FOUND);

    const data = await getProgramTracks({ orgId, departmentId });
    return { data };
  } catch (error) {
    console.error("getProgramTracksAction:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getProgramTracksBasicAction({ departmentId }: { departmentId?: string }) {
  try {
    const user = await getUserInfo();
    if (!user) throw new Error(ERRORS.AUTH.UNAUTHORIZED);

    const orgId = user.organization?.id;
    if (!orgId) throw new Error(ERRORS.ORG.NOT_FOUND);

    const data = await getProgramTracksBasic({ orgId, departmentId });
    return { data };
  } catch (error) {
    console.error("getProgramTracksBasicAction:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getProgramTracksByDepartmentAction({ departmentId }: { departmentId?: string }) {
  try {
    const result = await getProgramTracksAction({ departmentId });
    if ("error" in result) return result;
    return { data: groupProgramTracksByDepartment(result.data) };
  } catch (error) {
    console.error("getProgramTracksByDepartmentAction:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getProgramTrackAction({ programTrackId }: { programTrackId: string }) {
  try {
    const user = await getUserInfo();
    if (!user) throw new Error(ERRORS.AUTH.UNAUTHORIZED);

    const orgId = user.organization?.id;
    if (!orgId) throw new Error(ERRORS.ORG.NOT_FOUND);

    const track = await getProgramTrack({ programTrackId, orgId });
    if (!track) throw new Error("Filière introuvable");

    return { data: track };
  } catch (error) {
    console.error("getProgramTrackAction:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

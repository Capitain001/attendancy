"use server";

import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import { createProgramTrack, updateProgramTrack, deleteProgramTrack } from "../database";
import type { AddProgramTrackData, UpdateProgramTrackData } from "../database";

export async function createProgramTrackAction(data: AddProgramTrackData) {
  try {
    const auth = await authAccess({ requiredRole: "DIRECTION" });
    if (!auth.data) return { error: auth.error };
    const { orgId } = auth.data;

    const track = await createProgramTrack({ data, orgId });
    return { data: track };
  } catch (error) {
    console.error("createProgramTrackAction:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function updateProgramTrackAction(programTrackId: string, data: UpdateProgramTrackData) {
  try {
    const auth = await authAccess({ requiredRole: "ADMIN" });
    if (!auth.data) return { error: auth.error };
    const { orgId } = auth.data;

    const track = await updateProgramTrack({ programTrackId, orgId }, data);
    return { data: track };
  } catch (error) {
    console.error("updateProgramTrackAction:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function deleteProgramTrackAction(programTrackId: string) {
  try {
    const auth = await authAccess({ requiredRole: "ADMIN" });
    if (!auth.data) return { error: auth.error };
    const { orgId } = auth.data;

    await deleteProgramTrack({ programTrackId, orgId });
    return { data: { id: programTrackId } };
  } catch (error) {
    console.error("deleteProgramTrackAction:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

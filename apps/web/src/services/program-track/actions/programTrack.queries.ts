"use server";

import { authAccess } from '@/services/auth';
import { ERRORS } from "@/config";
import { getProgramTracks, getProgramTracksBasic, getProgramTrack } from "../database";
import { groupProgramTracksByDepartment } from "../utils";

export async function getProgramTracksAction({ departmentId }: { departmentId?: string }) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await getProgramTracks({ orgId, departmentId }) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

export async function getProgramTracksBasicAction({ departmentId }: { departmentId?: string }) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await getProgramTracksBasic({ orgId, departmentId }) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

export async function getProgramTracksByDepartmentAction({ departmentId }: { departmentId?: string }) {
  try {
    const result = await getProgramTracksAction({ departmentId });
    if ("error" in result) return result;
    return { data: groupProgramTracksByDepartment(result.data) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

export async function getProgramTrackAction({ programTrackId }: { programTrackId: string }) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    const track = await getProgramTrack({ programTrackId, orgId });
    if (!track) return { error: "Filière introuvable" };
    return { data: track };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

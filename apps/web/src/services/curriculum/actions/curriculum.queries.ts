"use server";

import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import { getCurriculums } from "../database";

export async function getCurriculumsAction() {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await getCurriculums(orgId) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

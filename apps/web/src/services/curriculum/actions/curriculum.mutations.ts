"use server";

import * as v from "valibot";
import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import { createCurriculumSchema } from "../validation";
import { createCurriculum, deleteCurriculum } from "../database";
import { logAuditAsync } from "@/services/audit";

export async function createCurriculumAction(input: unknown) {
  const parsed = v.safeParse(createCurriculumSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Donnees invalides" };
  }

  const auth = await authAccess({ requiredRole: "ADMIN" });
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await createCurriculum({ ...parsed.output, orgId }) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function deleteCurriculumAction(curriculumId: string) {
  const auth = await authAccess({ requiredRole: "ADMIN" });
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  try {
    const result = await deleteCurriculum(curriculumId, orgId);
    logAuditAsync({
      userId: user.id,
      orgId,
      action: "DELETE",
      resource: "CURRICULUM",
      resourceId: curriculumId,
      actor: { name: user.name, email: user.email },
    });
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

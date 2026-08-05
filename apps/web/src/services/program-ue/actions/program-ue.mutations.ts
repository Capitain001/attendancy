// src/services/program-ue/actions/program-ue.mutations.ts
"use server";

import { removeUEFromProgram } from "../database";
import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";

export async function removeUEFromProgramAction({
  programUEId,
  programId,
  ueId,
}: {
  programUEId?: string;
  programId: string;
  ueId?: string;
}) {
  try {
    const auth = await authAccess({ requiredRole: "DIRECTION", requiredFunction: "PRINCIPAL" });
    if (!auth.data) return { error: auth.error };

    const result = await removeUEFromProgram({
      programUEId,
      programId,
      ueId,
    });

    return { data: result };
  } catch (error) {
    console.error("removeUEFromProgramAction error:", error);
    return {
      error: error instanceof Error ? error.message : ERRORS.SERVER,
    };
  }
}

"use server";

import * as v from "valibot";
import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import {
  createEvaluationSchema,
  updateEvaluationSchema,
  upsertGradesSchema,
} from "../validation";
import type {
  CreateEvaluationInput,
  UpdateEvaluationInput,
  UpsertGradesInput,
} from "../validation";
import {
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  upsertGrades,
} from "../database";
import { logAuditAsync } from "@/services/audit";

export async function createEvaluationAction(input: CreateEvaluationInput) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  const parsed = v.safeParse(createEvaluationSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  try {
    const result = await createEvaluation({ ...parsed.output, orgId });
    logAuditAsync({
      userId: user.id,
      orgId,
      action: "CREATE",
      resource: "EVALUATION",
      resourceId: result.id,
      actor: { name: user.name, email: user.email },
    });
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function updateEvaluationAction(input: UpdateEvaluationInput) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  const parsed = v.safeParse(updateEvaluationSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  try {
    const result = await updateEvaluation(
      parsed.output.evaluationId,
      orgId,
      parsed.output.data,
    );
    logAuditAsync({
      userId: user.id,
      orgId,
      action: "UPDATE",
      resource: "EVALUATION",
      resourceId: result.id,
      actor: { name: user.name, email: user.email },
    });
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function deleteEvaluationAction(evaluationId: string) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  try {
    const result = await deleteEvaluation(evaluationId, orgId);
    logAuditAsync({
      userId: user.id,
      orgId,
      action: "DELETE",
      resource: "EVALUATION",
      resourceId: evaluationId,
      actor: { name: user.name, email: user.email },
    });
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function upsertGradesAction(input: UpsertGradesInput) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  const parsed = v.safeParse(upsertGradesSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  try {
    const result = await upsertGrades(
      parsed.output.evaluationId,
      orgId,
      parsed.output.data.grades,
    );
    logAuditAsync({
      userId: user.id,
      orgId,
      action: "UPDATE",
      resource: "EVALUATION",
      resourceId: parsed.output.evaluationId,
      actor: { name: user.name, email: user.email },
    });
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

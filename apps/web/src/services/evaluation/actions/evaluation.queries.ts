"use server";

import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import {
  getCourseEvaluations,
  getEvaluationDetail,
  getEvaluation,
} from "../database";

export async function getCourseEvaluationsAction(courseId: string) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await getCourseEvaluations(courseId, orgId) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getEvaluationDetailAction(evaluationId: string) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await getEvaluationDetail(evaluationId, orgId) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getEvaluationAction(evaluationId: string) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await getEvaluation(evaluationId, orgId) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

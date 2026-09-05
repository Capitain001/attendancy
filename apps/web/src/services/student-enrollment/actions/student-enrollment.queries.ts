"use server";

import * as v from "valibot";
import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import {
  getStudentsEnrollments,
  getStudentEnrollmentDetails,
  getStudentEnrollmentByClass,
  searchStudentsForEnrollment,
  type GetStudentsEnrollmentsFilters,
} from "../database";
import {
  searchStudentsForEnrollmentSchema,
  type SearchStudentsForEnrollmentInput,
} from "../validation";

export async function getStudentEnrollmentsAction(filters?: GetStudentsEnrollmentsFilters) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await getStudentsEnrollments(orgId, filters) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getStudentEnrollmentDetailsAction(studentEnrollmentId: string) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await getStudentEnrollmentDetails(studentEnrollmentId, orgId) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getStudentEnrollmentByClassAction(studentId: string, classId: string) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await getStudentEnrollmentByClass(studentId, classId, orgId) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function searchStudentsForEnrollmentAction(input: SearchStudentsForEnrollmentInput) {
  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  const parsed = v.safeParse(searchStudentsForEnrollmentSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  try {
    return { data: await searchStudentsForEnrollment(orgId, parsed.output.classId, parsed.output.query) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}
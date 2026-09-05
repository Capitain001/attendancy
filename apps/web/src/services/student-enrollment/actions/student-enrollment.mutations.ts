"use server";

import * as v from "valibot";
import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import {
  createStudentEnrollmentSchema,
  updateStudentEnrollmentSchema,
  transferStudentEnrollmentSchema,
  enrollStudentsInClassSchema,
  type CreateStudentEnrollmentInput,
  type UpdateStudentEnrollmentInput,
  type TransferStudentEnrollmentInput,
  type EnrollStudentsInClassInput,
} from "../validation";
import {
  createStudentEnrollment,
  removeStudentEnrollment,
  updateStudentEnrollment,
  transferStudentEnrollment,
  enrollStudentsInClass,
} from "../database";
import { logAuditAsync } from "@/services/audit";

export async function createStudentEnrollmentAction(input: CreateStudentEnrollmentInput) {
  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  const parsed = v.safeParse(createStudentEnrollmentSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  try {
    return { data: await createStudentEnrollment(parsed.output, orgId) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function removeStudentEnrollmentAction(studentEnrollmentId: string) {
  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  try {
    const result = await removeStudentEnrollment(studentEnrollmentId, orgId);
    logAuditAsync({
      userId: user.id,
      orgId,
      action: "DELETE",
      resource: "STUDENT_ENROLLMENT",
      resourceId: studentEnrollmentId,
      actor: { name: user.name, email: user.email },
    });
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

// Ne modifie plus que endedAt (classId/studentId retirés du schéma de
// mutation) — cf. transferStudentEnrollmentAction pour changer un étudiant
// de classe.
export async function updateStudentEnrollmentAction(input: UpdateStudentEnrollmentInput) {
  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  const parsed = v.safeParse(updateStudentEnrollmentSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  try {
    return { data: await updateStudentEnrollment(parsed.output.studentEnrollmentId, orgId, parsed.output.data) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function transferStudentEnrollmentAction(input: TransferStudentEnrollmentInput) {
  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  const parsed = v.safeParse(transferStudentEnrollmentSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  try {
    const result = await transferStudentEnrollment(
      parsed.output.studentEnrollmentId,
      parsed.output.studentId,
      parsed.output.newClassId,
      orgId,
    );
    logAuditAsync({
      userId: user.id,
      orgId,
      action: "UPDATE",
      resource: "STUDENT_ENROLLMENT",
      resourceId: parsed.output.studentEnrollmentId,
      actor: { name: user.name, email: user.email },
    });
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

// Import en masse : chaque étudiant est traité indépendamment côté service
// (cf. enrollStudentsInClass) — un échec individuel n'empêche pas les autres.
export async function enrollStudentsInClassAction(input: EnrollStudentsInClassInput) {
  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  const parsed = v.safeParse(enrollStudentsInClassSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  try {
    const results = await enrollStudentsInClass(parsed.output, orgId);
    logAuditAsync({
      userId: user.id,
      orgId,
      action: "CREATE",
      resource: "STUDENT_ENROLLMENT",
      resourceId: parsed.output.classId,
      actor: { name: user.name, email: user.email },
    });
    return { data: results };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}
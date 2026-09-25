// src/services/teacher-unavailability/actions/teacher-unavailability.mutations.ts
"use server";

import * as v from "valibot";

import { ERRORS } from "@/config";
import { requireTeacherContext } from "../auth";
import { createUnavailabilitySchema, updateUnavailabilitySchema } from "../validation";
import type { CreateUnavailabilityInput, UpdateUnavailabilityInput } from "../validation";
import { createTeacherUnavailability, deleteTeacherUnavailability, updateTeacherUnavailability } from "../database";

export async function createTeacherUnavailabilityAction(input: CreateUnavailabilityInput) {
  const auth = await requireTeacherContext();
  if (!auth.data) return { error: auth.error };
  const { orgId, teacherId } = auth.data;

  const parsed = v.safeParse(createUnavailabilitySchema, input);
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? "Données invalides" };

  try {
    return { data: await createTeacherUnavailability(orgId, teacherId, parsed.output) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

export async function updateTeacherUnavailabilityAction(input: UpdateUnavailabilityInput) {
  const auth = await requireTeacherContext();
  if (!auth.data) return { error: auth.error };
  const { orgId, teacherId } = auth.data;

  const parsed = v.safeParse(updateUnavailabilitySchema, input);
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? "Données invalides" };

  try {
    return {
      data: await updateTeacherUnavailability(
        parsed.output.teacherUnavailabilityId,
        orgId,
        teacherId,
        parsed.output.data,
      ),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

export async function deleteTeacherUnavailabilityAction({
  teacherUnavailabilityId
}: {
  teacherUnavailabilityId: string;
}) {
  const auth = await requireTeacherContext();
  if (!auth.data) return { error: auth.error };
  const { orgId, teacherId } = auth.data;

  try {
    await deleteTeacherUnavailability(teacherUnavailabilityId, orgId, teacherId);
    return { data: { teacherUnavailabilityId } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}
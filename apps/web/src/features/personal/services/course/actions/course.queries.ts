"use server";

import * as v from "valibot";
import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import { getPersonalCourses } from "../database";
import { getPersonalCoursesSchema } from "../validation";
import type { GetPersonalCoursesInput } from "../validation";

// classId optionnel : sans lui, tous les cours de l'org ; avec lui, ceux
// d'une seule classe. L'orgId vient du token, jamais de l'input.
export async function getPersonalCoursesAction(input: GetPersonalCoursesInput = {}) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  const parsed = v.safeParse(getPersonalCoursesSchema, input);
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? "Données invalides" };

  try {
    return { data: await getPersonalCourses(orgId, parsed.output.classId) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}
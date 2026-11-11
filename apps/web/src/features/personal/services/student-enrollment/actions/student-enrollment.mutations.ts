// src/features/personal/services/student-enrollment/actions/student-enrollment.mutations.ts
"use server";

import * as v from "valibot";
import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import { enrollStudentsInPersonalCourseSchema } from "../validation";
import type { EnrollStudentsInPersonalCourseInput } from "../validation";
import { enrollStudentsInPersonalCourse } from "../database";

export async function enrollStudentsInPersonalCourseAction(input: EnrollStudentsInPersonalCourseInput) {
  const auth = await authAccess({ requiredRole: "TEACHER", requiredOrgType: "PERSONAL" });
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  const parsed = v.safeParse(enrollStudentsInPersonalCourseSchema, input);
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? "Données invalides" };

  try {
    return { data: await enrollStudentsInPersonalCourse({ ...parsed.output, orgId }) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

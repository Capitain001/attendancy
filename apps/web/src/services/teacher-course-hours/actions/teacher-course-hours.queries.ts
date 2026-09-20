"use server";

import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import { getTeacherCourseHourss } from "../database";

export async function getTeacherCourseHourssAction() {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await getTeacherCourseHourss(orgId) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

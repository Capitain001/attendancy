// src/features/personal/services/class/actions/class.queries.ts
'use server'

import * as v from "valibot";
import { authAccess } from "@/modules/auth"
import {getDefaultPersonalClass , getPersonalClasses } from "../database";
import { ERRORS } from "@/config"
import { getPersonalClassesSchema } from "../validation";
import type { GetPersonalClassesInput } from "../validation";

export async function getDefaultPersonalClassAction() {
  const auth = await authAccess({ requiredRole: 'TEACHER', requiredOrgType: 'PERSONAL' })
  if (!auth.data) return { error: auth.error }

  try {
    return { data: await getDefaultPersonalClass(auth.data.orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}



// classId optionnel : sans lui, toutes les classes de l'org ; avec lui,
// uniquement celle-ci. L'orgId vient du token, jamais de l'input.
export async function getPersonalClassesAction(input: GetPersonalClassesInput = {}) {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  const parsed = v.safeParse(getPersonalClassesSchema, input);
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? "Données invalides" };

  try {
    return { data: await getPersonalClasses(orgId, parsed.output.classId) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}
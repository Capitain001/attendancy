"use server";

import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import { generateTeachers, type GenerateTeachersOptions } from "./generators/teacher";
import { generateStudents, type GenerateStudentsOptions } from "./generators/student";
import { generateParents, type GenerateParentsOptions } from "./generators/parent";
import {
  linkRandomTeachersToCourses,
  type LinkRandomTeachersToCoursesOptions,
} from "./generators/course-teacher";
import { purgeSeedData, type PurgeSeedDataOptions } from "./purge/purge";

// ⚠️ Point ouvert (voir message d'accompagnement) : requiredRole: "ADMIN" ici
// fait référence au Role ORG-SCOPÉ (enum Role sur UserOrganization), pas au
// modèle Admin (back-office produit, "hors org"). Pour un outil aussi
// sensible, il faudrait probablement vérifier la présence d'un profil Admin
// global plutôt qu'un rôle par-org — à confirmer selon ce que authAccess
// expose réellement. Le garde-fou ensureSeedingAllowed (NODE_ENV) reste le
// filet de sécurité principal quoi qu'il arrive.
async function requireSeedAccess() {
  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error } as const;
  return { ok: true } as const;
}

// Note d'architecture : orgId est un paramètre explicite de chaque action
// (pas dérivé de auth.data.orgId comme dans les autres services) — un
// opérateur qui utilise ce panel choisit QUELLE organisation de test/démo
// peupler, il n'est pas nécessairement rattaché à cette org lui-même.

export async function generateTeachersAction(orgId: string, options?: GenerateTeachersOptions) {
  const access = await requireSeedAccess();
  if ("error" in access) return { error: access.error };

  try {
    return { data: await generateTeachers(orgId, options) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function generateStudentsAction(orgId: string, options?: GenerateStudentsOptions) {
  const access = await requireSeedAccess();
  if ("error" in access) return { error: access.error };

  try {
    return { data: await generateStudents(orgId, options) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function generateParentsAction(orgId: string, options?: GenerateParentsOptions) {
  const access = await requireSeedAccess();
  if ("error" in access) return { error: access.error };

  try {
    return { data: await generateParents(orgId, options) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function linkRandomTeachersToCoursesAction(
  orgId: string,
  options?: LinkRandomTeachersToCoursesOptions,
) {
  const access = await requireSeedAccess();
  if ("error" in access) return { error: access.error };

  try {
    return { data: await linkRandomTeachersToCourses(orgId, options) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function purgeSeedDataAction(orgId: string, options?: PurgeSeedDataOptions) {
  const access = await requireSeedAccess();
  if ("error" in access) return { error: access.error };

  try {
    return { data: await purgeSeedData(orgId, options) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

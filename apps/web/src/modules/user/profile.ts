// src/services/user/profile.ts

import type { Organization } from "@/types/user";
import { Role } from "@/generated/prisma/client";

/* =========================
   MAPPING RÔLE ? CLÉ PROFIL
========================= */

const ROLE_PROFILE_KEY: Partial<Record<Role, keyof Organization>> = {
  STUDENT: "studentId",
  TEACHER: "teacherId",
  PARENT: "parentId",
  DIRECTION: "directionId",
};

/**
 * Retourne la clé de profil dans `Organization` correspondant au rôle.
 * Retourne `null` si le rôle n'a pas de profil associé (ex: ADMIN, GUEST).
 *
 * @example
 * getRoleProfileKey("TEACHER") // ? "teacherId"
 * getRoleProfileKey("ADMIN")   // ? null
 */
export function getRoleProfileKey(role: Role): keyof Organization | null {
  return ROLE_PROFILE_KEY[role] ?? null;
}


/**
 * Injecte l'ID de profil de rôle dans un objet Organization.
 * Retourne l'organisation inchangée si le rôle n'a pas de clé ou si profileId est absent.
 *
 * @example
 * injectRoleProfileId(org, "TEACHER", "abc-123")
 * // ? { ...org, teacherId: "abc-123" }
 */
export function injectRoleProfileId(
  organization: Organization,
  role: Role,
  profileId?: string
): Organization {
  const profileKey = getRoleProfileKey(role);
  if (!profileKey || !profileId) return organization;
  return { ...organization, [profileKey]: profileId };
}

/**
 * Met à jour l'ID de profil de rôle dans le tableau `organizations`
 * pour une organisation cible identifiée par `orgId`.
 * Les autres organisations sont retournées inchangées.
 *
 * Utilisé après la création d'une entité métier (Teacher, Student, etc.)
 * pour synchroniser les metadata Supabase.
 *
 * @example
 * updateOrganizationsProfile(user.organizations, orgId, "TEACHER", teacher.id)
 *
 */
export function updateOrganizationsProfile(
  organizations: Organization[] = [],
  orgId: string,
  role: Role,
  profileId?: string
): Organization[] {
  return organizations.map((org) =>
    org.id === orgId ? injectRoleProfileId(org, role, profileId) : org
  );
}

/**
 * Retourne l'ID du profil actif dans une organisation,
 * quel que soit le rôle (teacher, student, parent, direction).
 * Retourne `null` si aucun profil n'est défini.
 *
 * Utile pour les guards, les queries attendance/session,
 * ou pour vérifier qu'un profil a bien été créé.
 *
 * @example
 * getCurrentProfileId(user.organization) // ? "teacher-uuid" | null
 */
export function getCurrentProfileId(organization?: Organization): string | null {
  return (
    organization?.teacherId ??
    organization?.studentId ??
    organization?.parentId ??
    organization?.directionId ??
    null
  );
}


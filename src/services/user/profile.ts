// src/services/user/profile.ts
// Fonctions PURES — injection des IDs de profil dans les métadonnées Supabase.
// Utilisées par syncUserOrganizationProfile (update.ts) après création d'une
// entité métier (Teacher, Student, Parent, Direction) pour maintenir le snapshot
// org cohérent dans Supabase user_metadata.
import type { Role, Organization } from './types'

// Mapping rôle → clé de profil dans Organization.
// ⚠ À ÉTENDRE PAR PROJET — une entrée par rôle qui porte un profil DB.
const ROLE_PROFILE_KEY: Partial<Record<Role, keyof Organization>> = {
  TEACHER:   'teacherId',
  STUDENT:   'studentId',
  PARENT:    'parentId',
  DIRECTION: 'directionId',
}

export function getRoleProfileKey(role: Role): keyof Organization | null {
  return ROLE_PROFILE_KEY[role] ?? null
}

// Injecte l'ID de profil dans un objet Organization.
// No-op si le rôle n'a pas de clé ou si profileId est absent.
export function injectRoleProfileId(
  organization: Organization,
  role: Role,
  profileId?: string
): Organization {
  const key = getRoleProfileKey(role)
  if (!key || !profileId) return organization
  return { ...organization, [key]: profileId }
}

// Met à jour le profileId dans le tableau organizations pour l'org cible.
export function updateOrganizationsProfile(
  organizations: Organization[] = [],
  orgId: string,
  role: Role,
  profileId?: string
): Organization[] {
  return organizations.map((org) =>
    org.id === orgId ? injectRoleProfileId(org, role, profileId) : org
  )
}

// Retourne l'ID du profil actif (quel que soit le rôle) ou null.
// Utile pour les guards et les queries qui nécessitent le profileId.
export function getCurrentProfileId(organization?: Organization): string | null {
  return (
    organization?.teacherId ??
    organization?.studentId ??
    organization?.parentId ??
    organization?.directionId ??
    null
  )
}

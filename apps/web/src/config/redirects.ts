// src/config/redirects.ts
import { Functions, Role, UserInfo, UserRoles } from "@/types/user";

// Mapping des chemins par rôle
export const ROLE_PATHS: Record<Role, string> = {
  [UserRoles.ADMIN]: "admin",
  [UserRoles.TEACHER]: "teacher",
  [UserRoles.STUDENT]: "student",
  [UserRoles.PARENT]: "parent",
  [UserRoles.DIRECTION]: "direction",
  [UserRoles.GUEST]: "/invite",
};


/**
 * Résout la destination post-login selon le profil utilisateur.
 *
 * Règles :
 * - Pas d'organisation → /auth/org/info (aucune distinction de fonction/rôle)
 * - Pas de rôle (ou rôle inconnu) → /login (fallback, sans préfixe)
 * - Sinon → /{orgSlug}/{rolePath} (aucune distinction pour GUEST)
 */
export function redirectUser(user: Partial<UserInfo>): string {
  if (!user.organization?.slug) {
    return '/auth/org/info'
  }

  const rolePath = user.role ? ROLE_PATHS[user.role] : undefined

  if (!rolePath) {
    return '/login'
  }

  return `/${user.organization.slug}/${rolePath}`
}




/**
 * Retourne le path de l'utilisateur en fonction de son rôle et de son organisation
 * @param user - L'utilisateur (optionnel)
 * @returns path sous forme de string
 */
export function orgPath(user?: UserInfo): string {
  if (!user || !user.role) return "/";

  const roleBase = ROLE_PATHS[user.role] ?? "/"; 

  const path = user.organization?.slug 
    ? `/${user.organization.slug}/${roleBase}` 
    : `/${roleBase}`;

  return path;
}


/**
 * Retourne le chemin de redirection pour un rôle donné
 * @param role rôle de l'utilisateur
 * @param orgSlug slug de l'organisation (optionnel)
 */
export function getRedirectPath(role: Role, orgSlug?: string) {
  const basePath = ROLE_PATHS[role] ?? "/login";

  // Pour les rôles avec orgSlug
  if (orgSlug) {
    return `/${orgSlug}/${basePath}`;
  }

  return '/auth/org/info';
}

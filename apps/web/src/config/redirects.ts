// src/config/redirects.ts
import type { Organization, Role, UserInfo } from "@/types/user";
import { UserRoles } from "@/types/user";

// Mapping des chemins par rôle
export const ROLE_PATHS: Record<Role, string> = {
  [UserRoles.ADMIN]: "admin",
  [UserRoles.TEACHER]: "teacher",
  [UserRoles.STUDENT]: "student",
  [UserRoles.PARENT]: "parent",
  [UserRoles.DIRECTION]: "direction",
  [UserRoles.GUEST]: "/invite",
};

// Segment racine de l'arbre de routes des espaces personnels : `/personal/{slug}`.
// Propre au type PERSONAL (ce n'est pas une règle générique par type — ne pas le
// dériver de `org.type`). Doit rester aligné avec RESERVED_SLUGS (src/lib/slug.ts)
// et le dossier de route correspondant dans src/app.
const PERSONAL_ROUTE_SEGMENT = "personal";

/**
 * Base d'URL d'une organisation pour un rôle donné.
 *
 * Espace personnel : arbre dédié `/personal/{slug}` pour son propriétaire
 * (TEACHER) uniquement — l'interface diffère (création de classes, quota).
 * Élèves et parents invités n'ont rien de spécifique : ils utilisent l'arbre
 * standard `/{slug}/…`. `type` absent (snapshot antérieur à Organization.type)
 * = institution.
 */
function orgBasePath(
  org: { slug: string; type?: Organization["type"] },
  role: Role,
): string {
  return org.type === "PERSONAL" && role === UserRoles.TEACHER
    ? `/${PERSONAL_ROUTE_SEGMENT}/${org.slug}/${ROLE_PATHS[role]}`
    : `/${org.slug}`;
}

/**
 * Résout la destination post-login selon le profil utilisateur.
 *
 * Règles :
 * - Pas d'organisation → /auth/org/info (aucune distinction de fonction/rôle)
 * - Pas de rôle (ou rôle inconnu) → /login (fallback, sans préfixe)
 * - Espace personnel + TEACHER → /personal/{orgSlug}/teacher
 * - Sinon → /{orgSlug}/{rolePath} (aucune distinction pour GUEST)
 */
export function redirectUser(user: Partial<UserInfo>): string {
  const { organization: org, role } = user;

  if (!org?.slug) {
    return "/auth/org/info";
  }

  const rolePath = role ? ROLE_PATHS[role] : undefined;

  if (!role || !rolePath) {
    return "/login";
  }

  return `${orgBasePath({ slug: org.slug, type: org.type }, role)}/${rolePath}`;
}

/**
 * Retourne le path de l'utilisateur en fonction de son rôle et de son organisation
 * @param user - L'utilisateur (optionnel)
 * @returns path sous forme de string
 */
export function orgPath(user?: UserInfo): string {
  if (!user?.role) return "/";

  const roleBase = ROLE_PATHS[user.role] ?? "/";
  const org = user.organization;

  return org?.slug
    ? `${orgBasePath({ slug: org.slug, type: org.type }, user.role)}/${roleBase}`
    : `/${roleBase}`;
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

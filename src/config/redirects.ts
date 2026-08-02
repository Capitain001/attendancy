// src/config/redirects.ts
// Résolution de la destination post-login selon le profil utilisateur.
// Fonctions pures — testables sans I/O.
import type { UserInfo } from '@/services/user/types'
import { ROLE_PATHS } from './roles'

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
}

export function orgPath(user?: Partial<UserInfo>): string {
  if (!user?.role || !user.organization?.slug) return '/'
  return `/${user.organization.slug}/${ROLE_PATHS[user.role]}`
}

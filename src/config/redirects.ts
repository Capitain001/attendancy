// src/config/redirects.ts
// Résolution de la destination post-login selon le profil utilisateur.
// Fonctions pures — testables sans I/O.
import type { UserInfo } from '@/services/user/types'
import { ROLE_PATHS } from './roles'

// Où envoyer l'utilisateur après connexion :
// pas d'organisation → onboarding ; sinon → espace de son rôle.
export function redirectUser(user: Partial<UserInfo>): string {
  if (!user.organization?.slug) return '/auth/org-setup'
  if (user.role) return `/${user.organization.slug}/${ROLE_PATHS[user.role]}`
  return '/login'
}

export function orgPath(user?: Partial<UserInfo>): string {
  if (!user?.role || !user.organization?.slug) return '/'
  return `/${user.organization.slug}/${ROLE_PATHS[user.role]}`
}

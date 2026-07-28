// src/services/auth/types.ts
// Types propres au module auth — complète les types dans services/user/types.ts.
// AuthorizationResult et Permission sont définis dans authorization.ts et
// ré-exportés ici pour une importation locale pratique.
export type { AuthorizationResult, Permission } from './authorization'

// Résultat d'une action signup — userId retourné pour le redirect/tracking.
export type SignupResult = { data: { userId: string } } | { error: string }

// Résultat d'une action login — redirectPath calculé côté serveur.
export type LoginResult = { data: { redirectPath: string } } | { error: string }

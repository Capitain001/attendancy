// src/services/auth/types.ts
// Types propres au module auth — complète les types dans services/user/types.ts.
// AuthorizationResult et Permission sont définis dans authorization.ts et
// ré-exportés ici pour une importation locale pratique.
export type { Authorization, Permission } from './authorization'


export type AuthActionResult = { error: string } | null;
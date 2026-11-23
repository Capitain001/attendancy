// packages/auth/src/cache.ts
// Clés du cache React Query propres au package auth.

// Définie une seule fois : la clé complète et la racine ne peuvent pas diverger.
const CURRENT_USER_ROOT = ["currentUser"] as const;

export const AUTH_CACHE_KEYS = {
  // Racine : sert aux suppressions par préfixe (removeQueries), jamais à lire une donnée.
  CURRENT_USER_ROOT,
  // Instantané du dernier utilisateur connu : écrit par useAuthUser à partir de la session
  // (aucune requête réseau), persisté pour être relu hors ligne.
  CURRENT_USER: (userId: string | null) => [...CURRENT_USER_ROOT, userId] as const,
} as const;
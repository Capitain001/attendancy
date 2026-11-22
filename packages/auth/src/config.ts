// packages/auth/src/config.ts
export const AUTH_CACHE_KEYS = {
  CURRENT_USER: (userId: string | null) => ["currentUser", userId] as const,
} as const;

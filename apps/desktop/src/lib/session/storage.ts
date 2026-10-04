// apps/desktop/src/lib/session/storage.ts
import type { SupportedStorage } from '@supabase/supabase-js'

// Seul point à remplacer si on passe à un stockage chiffré.
export const sessionStorage: SupportedStorage = {
  getItem: async (key) => localStorage.getItem(key),
  setItem: async (key, value) => localStorage.setItem(key, value),
  removeItem: async (key) => localStorage.removeItem(key),
}
// src/store/userStore.ts
// Store Zustand persisté du user courant — pattern de référence.
// Quand utiliser un store vs React Query vs RSC : voir STORE_CONTEXT.md.
'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserInfo } from '@/services/user/types'

interface UserState {
  user: Partial<UserInfo> | null
  isLoading: boolean
  error: string | null

  setUser: (user: Partial<UserInfo> | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clear: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clear: () => set({ user: null, error: null, isLoading: false }),
    }),
    {
      name: 'user-storage',
      // localStorage : persiste entre sessions navigateur.
      storage: createJSONStorage(() => localStorage),
    }
  )
)

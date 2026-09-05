"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserInfo } from "@/modules/user"

interface UserState {
  user: UserInfo | null
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
      clear: () => set({ 
        user: null, 
        error: null, 
        isLoading: false 
      }),
    }),
    {
      name: "user-storage",
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null
          const str = localStorage.getItem(name) // ← localStorage pour persistance longue
          return str ? JSON.parse(str) : null
        },
        setItem: (name, value) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(name, JSON.stringify(value))
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name)
          }
        },
      },
    }
  )
)

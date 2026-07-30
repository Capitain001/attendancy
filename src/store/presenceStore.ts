"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { PresenceUser } from "@/services/user"

interface PresenceState {
  onlineUsers: Record<string, PresenceUser>
  lastUpdated: string | null
  
  setOnlineUsers: (users: Record<string, PresenceUser>) => void
  updateOnlineUser: (userId: string, user: PresenceUser) => void
  removeOnlineUser: (userId: string) => void
  clearOnlineUsers: () => void
}

export const usePresenceStore = create<PresenceState>()(
  persist(
    (set, get) => ({
      onlineUsers: {},
      lastUpdated: null,
      
      setOnlineUsers: (users) => 
        set({ 
          onlineUsers: users,
          lastUpdated: new Date().toISOString()
        }),
      
      updateOnlineUser: (userId, user) =>
        set((state) => ({
          onlineUsers: {
            ...state.onlineUsers,
            [userId]: user
          },
          lastUpdated: new Date().toISOString()
        })),
      
      removeOnlineUser: (userId) =>
        set((state) => {
          const { [userId]: removed, ...remainingUsers } = state.onlineUsers
          return {
            onlineUsers: remainingUsers,
            lastUpdated: new Date().toISOString()
          }
        }),
      
      clearOnlineUsers: () =>
        set({ 
          onlineUsers: {},
          lastUpdated: new Date().toISOString()
        }),
    }),
    {
      name: "presence-storage",
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name)
          return str ? JSON.parse(str) : null
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name)
        },
      },
    }
  )
)
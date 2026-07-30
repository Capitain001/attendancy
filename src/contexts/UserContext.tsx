"use client"

import { createContext, useContext, useEffect, useMemo } from "react"
import { useUserStore } from "@/store/userStore"
import { usePresenceStore } from "@/store/presenceStore"
import { usePresence } from "@/hooks/realtime/usePresence"
import { getUserInfo, PresenceUser, UserInfo } from "@/services/user"




interface UserContextType {
  user: UserInfo | null
  isLoading: boolean
  error: string | null
  onlineUsers: Record<string, PresenceUser>
  otherUsers: Record<string, PresenceUser> // ← Nouveau
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: React.ReactNode
  initialUser?: UserInfo | null
}

export function UserProvider({ children, initialUser = null }: UserProviderProps) {
  // UserStore - Données persistantes
  const { user, isLoading, error, setUser, setLoading, setError } = useUserStore()
  
  // PresenceStore - Données temps réel
  const { onlineUsers, setOnlineUsers } = usePresenceStore()

  // Utiliser ton hook de présence
  const { users: presenceUsers } = usePresence({
    roomName: user?.organization?.id ? `org:${user.organization.id}` : 'global',
    user: user
  })

  // Synchroniser la présence du hook vers le store
  useEffect(() => {
    setOnlineUsers(presenceUsers)
  }, [presenceUsers, setOnlineUsers])

  // Initialiser l'user
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser)
    }
  }, [initialUser, setUser])

  // Fonction refresh
  const refreshUser = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const freshUser = await getUserInfo()
      setUser(freshUser)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de rafraîchissement")
    } finally {
      setLoading(false)
    }
  }

  // Calculer les autres utilisateurs (tous sauf l'utilisateur courant)
  const otherUsers = useMemo(() => {
    if (!user?.id) return onlineUsers;
    
    const { [user.id]: _, ...others } = onlineUsers;
    return others;
  }, [onlineUsers, user?.id])

  const value: UserContextType = {
    user,
    isLoading,
    error,
    onlineUsers,
    otherUsers, // ← others users
    refreshUser,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
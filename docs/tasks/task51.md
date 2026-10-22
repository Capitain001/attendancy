(alias) type SessionState = {
    status: "signed-in";
    session: Session;
} | {
    status: "offline-stale";
} | {
    status: "signed-out";
}
import SessionState

//packages\auth\src\AuthProvider.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { claimLocalData } from "@attendancy/cache";
import { supabase } from "./supabase";
import { getSessionState, type SessionState } from "./session";

// undefined = pas de Provider, null = chargement
const AuthContext = createContext<SessionState | null | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState | null>(null);

  useEffect(() => {
    getSessionState().then(setState);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getSessionState().then(setState);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (state?.status === "signed-in") {
      void claimLocalData(state.session.user.id);
    }
  }, [state]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const state = useContext(AuthContext);
  if (state === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return state;
}

// hook qui met en cache userInfo dans l apps client 

//packages\auth\src\useCurrentUser.ts
import { useQuery } from "@tanstack/react-query";
import type { UserInfo } from "@attendancy/types";
import { useAuth } from "./AuthProvider";
import { api } from "./api";

export function useCurrentUser() {
  const auth = useAuth();
  const isSignedIn = auth?.status === "signed-in";
  const userId = isSignedIn ? auth.session.user.id : null;

  return useQuery({
    queryKey: ["currentUser", userId],
    queryFn: async (): Promise<UserInfo | null> => {
      const res = await api.getCurrentUserAction();
      if ("error" in res && res.error) {
        throw new Error(res.error);
      }
      return (res.data as UserInfo) ?? null;
    },
    enabled: isSignedIn && !!userId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

declare function getCurrentUserAction(): Promise<{
    data: src.UserInfo;
    error?: undefined;
} | {
    error: string;
    data?: undefined;
}>;

//apps\web\src\modules\auth\rpc\actions.ts
"use server";
import { getUserInfo } from "@/modules/user";
import { ERRORS } from "@/config";
import { mapUserRpc } from "./utils";

export async function getCurrentUserAction() {
  try {
    const user = await getUserInfo();
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED };
    // filtre les donner serveur critique et non utile au client et renvoie le reste au client 
    return { data: mapUserRpc(user) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}



pluto que useCurrentUser devrais t on avoir :

l equivalent de web :

//apps\web\src\contexts\UserContext.tsx
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



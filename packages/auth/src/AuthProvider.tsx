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

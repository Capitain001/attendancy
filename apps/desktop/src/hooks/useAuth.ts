// apps/desktop/src/hooks/useAuth.ts
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { claimLocalData } from '@desktop/lib/cache/clear'
import { supabase } from '../lib/supabase'
import {
  getSessionState,
  type SessionState,
} from "../lib/auth/session";

const AuthContext = createContext<SessionState | null | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState | null>(null); // null = chargement

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

  return createElement(AuthContext.Provider, { value: state }, children);
}

export function useAuth() {
  const state = useContext(AuthContext);
  if (state === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return state;
}
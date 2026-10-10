packages/auth/
├── package.json
├── tsconfig.json
├── index.ts
├── supabase.ts
├── session.ts
├── AuthProvider.tsx
└── guards.ts
package.json
json
{
  "name": "@attendancy/auth",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts"
  },
  "dependencies": {
    "@attendancy/cache": "workspace:*"
  },
  "peerDependencies": {
    "@tanstack/react-router": "*",
    "react": "*"
  }
}

react et le routeur sont en peerDependencies pour que le package utilise la copie de l’app, et pas une seconde copie qui casserait les contextes. Complète avec :

powershell
pnpm --filter @attendancy/auth add @supabase/supabase-js
pnpm --filter @attendancy/auth add -D typescript vite @types/react react @tanstack/react-router
pnpm install
tsconfig.json
json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["."]
}
supabase.ts

Copie ton apps/desktop/src/lib/supabase.ts. Si tu préfères repartir de zéro, adapte les noms de variables :

ts
/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
session.ts
ts
import {
  isAuthRetryableFetchError,
  type Session,
} from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type SessionState =
  | { status: "signed-in"; session: Session }
  // Connecté localement, mais le renouvellement du token a échoué faute de réseau.
  | { status: "offline-stale" }
  | { status: "signed-out" };

export async function getSessionState(): Promise<SessionState> {
  const { data, error } = await supabase.auth.getSession();
  if (data.session) return { status: "signed-in", session: data.session };
  if (error && isAuthRetryableFetchError(error)) return { status: "offline-stale" };
  return { status: "signed-out" };
}

export async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// null = chargement. Remplace les comparaisons répétées de l'ancien router.
export function isAuthenticated(state: SessionState | null | undefined): boolean {
  return state?.status === "signed-in" || state?.status === "offline-stale";
}
AuthProvider.tsx
tsx
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
guards.ts
ts
import { redirect } from "@tanstack/react-router";
import type { SessionState } from "./session";

export type AuthRouterContext = {
  auth: SessionState & { isAuthenticated: boolean };
};

// Pour le layout des pages protégées (_app/route.tsx)
export function requireAuth({ context }: { context: AuthRouterContext }) {
  if (!context.auth.isAuthenticated) throw redirect({ to: "/" });
}

// Pour le layout des pages publiques (auth/route.tsx)
export function requireGuest({ context }: { context: AuthRouterContext }) {
  if (context.auth.isAuthenticated) throw redirect({ to: "/" });
}
index.ts
ts
export { AuthProvider, useAuth } from "./AuthProvider";
export {
  getSessionState,
  getToken,
  isAuthenticated,
  type SessionState,
} from "./session";
export { requireAuth, requireGuest, type AuthRouterContext } from "./guards";
export { supabase } from "./supabase";

Test
powershell ( a adapter pr utiliser bun)
pnpm --filter @attendancy/auth exec tsc --noEmit
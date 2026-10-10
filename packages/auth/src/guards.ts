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

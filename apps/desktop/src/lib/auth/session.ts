  import {
    isAuthRetryableFetchError,
    type Session,
  } from "@supabase/supabase-js";
  import { supabase } from "../supabase";

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

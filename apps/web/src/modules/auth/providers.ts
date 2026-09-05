// provider.ts 
"use client";

import { supabase } from "@/utils/supabase/client";

type OAuthProvider = "google" | "github";

export async function signInWithOAuthProvider(provider: OAuthProvider, next?: string) {
  const redirectTo = `${window.location.origin}/auth/callback${
    next ? `?next=${encodeURIComponent(next)}` : ""
  }`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  if (error) {
    console.error(`${provider} login error:`, error.message);
    // à remplacer par un toast/state d'erreur selon la logique UI
  }
}

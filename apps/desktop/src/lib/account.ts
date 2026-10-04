import { api } from "./api";
import { getDeviceId } from "./device-id";
import { queryClient } from "./query-client";
import { supabase } from "./supabase";
import type { LoginInput } from "@/modules/auth/validation";

export async function login({
  email,
  password,
}: LoginInput): Promise<string | null> {
  queryClient.removeQueries({ queryKey: ["me"] });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return "Adresse e-mail ou mot de passe incorrect.";

  try {
    const result = await api.registerDeviceAction({ deviceId: getDeviceId() });
    if ("error" in result) {
      console.warn("[login] appareil non enregistré:", result.error);
    }
  } catch (error) {
    console.warn("[login] appareil non enregistré:", error);
  }

  return null;
}

export async function signupPersonal(email: string, password: string) {
  // Keep signup and profile creation on the server; desktop only sends credentials.
  return api.signupPersonalDesktopAction({ email, password });
}

export async function logout(): Promise<void> {
  try {
    const result = await api.endSessionAction({ deviceId: getDeviceId() });
    if ("error" in result) {
      console.warn("[logout] session non clôturée:", result.error);
    }
  } catch (error) {
    console.warn("[logout] session non clôturée:", error);
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  queryClient.removeQueries({ queryKey: ["me"] });
}

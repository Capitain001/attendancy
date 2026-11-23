//packages\auth\src\actions\login.ts
import { supabase } from "../supabase";
import { api } from "../api";
import { getDeviceId } from "../device-id";
import { AUTH_CACHE_KEYS } from "../cache";
import { claimLocalData, queryClient } from "@attendancy/cache";

export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  queryClient.removeQueries({ queryKey: AUTH_CACHE_KEYS.CURRENT_USER_ROOT });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) return "Email ou mot de passe incorrect";
  // avant le premier écran : un autre utilisateur ne voit jamais le cache du précédent
  await claimLocalData(data.user.id);

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
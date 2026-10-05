import type { LoginInput } from "@/modules/auth/validation";
import { api } from "@desktop/lib/api";
import { getDeviceId } from "@desktop/lib/device-id";
import { queryClient } from "@desktop/lib/query-client";
import { supabase } from "@desktop/lib/supabase";
import { claimLocalData } from "@desktop/lib/cache/clear";

export async function login({
  email,
  password,
}: LoginInput): Promise<string | null> {
  queryClient.removeQueries({ queryKey: ["me"] });
  const {  data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) return 'Email ou mot de passe incorrect'
    // avant le premier écran : un autre utilisateur ne voit jamais le cache du précédent
  await claimLocalData(data.user.id)
  
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

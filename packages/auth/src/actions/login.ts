import { supabase } from "../supabase";
import { api } from "../api";
import { getDeviceId } from "../device-id";
import { claimLocalData, queryClient } from "@attendancy/cache";

export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<string | null> {
  queryClient.removeQueries({ queryKey: ["me"] });
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

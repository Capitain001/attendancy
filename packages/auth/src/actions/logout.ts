//packages\auth\src\actions\logout.ts
import { supabase } from "../supabase";
import { api } from "../api";
import { getDeviceId } from "../device-id";
import { AUTH_CACHE_KEYS } from "../cache";
import { clearLocalData, queryClient } from "@attendancy/cache";

export async function logout() {
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
  await clearLocalData();
  queryClient.removeQueries({ queryKey: AUTH_CACHE_KEYS.CURRENT_USER_ROOT });
}
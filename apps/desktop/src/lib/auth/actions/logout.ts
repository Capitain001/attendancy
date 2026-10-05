import { api } from "@desktop/lib/api";
import { getDeviceId } from "@desktop/lib/device-id";
import { queryClient } from "@desktop/lib/query-client";
import { supabase } from "@desktop/lib/supabase";

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

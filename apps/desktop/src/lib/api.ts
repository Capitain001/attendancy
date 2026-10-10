// apps/desktop/src/lib/api.ts
import type { ApiClient } from "@attendancy/types";
import { API_URL } from "../config/url";
import { getToken } from "./auth/session";
import { supabase } from "./supabase";
import { NetworkError } from "./error";

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const reviver = (_: string, v: unknown) =>
  typeof v === "string" && ISO.test(v) ? new Date(v) : v;
// L'inscription est le seul appel RPC desktop accessible sans session.
const PUBLIC_ACTIONS = new Set(["signupPersonalDesktopAction"]);



function send(action: string, input: unknown, token?: string) {
  return fetch(`${API_URL}/api/rpc/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: input === undefined ? undefined : JSON.stringify(input),
  }).catch(() => {
    throw new NetworkError("Réseau indisponible");
  });
}

export const api = new Proxy(
  {},
  {
    get: (_, action: string) => async (input?: unknown) => {
      const token = await getToken();
      if (!token && !PUBLIC_ACTIONS.has(action))
        return { error: "Not authenticated" };

      let res = await send(action, input, token ?? undefined);

      if (res.status === 401 && token) {
        // un seul refresh, un seul rejeu
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) return { error: "Not authenticated" };
        res = await send(action, input, data.session.access_token);
      }

      return JSON.parse(await res.text(), reviver);
    },
  },
) as ApiClient;

/* Keep network failures as exceptions so React Query preserves its cached data. */

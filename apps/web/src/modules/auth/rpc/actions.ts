// src/modules/auth/rpc/actions.ts
//apps\web\src\modules\auth\rpc\actions.ts
"use server";
import { getUserInfo } from "@/modules/user";
import { ERRORS } from "@/config";
import { mapUserRpc } from "./utils";
import { hasId } from "@/lib/map";

export async function getCurrentUserAction() {
  try {
    const user = await getUserInfo();
    if (!hasId(user)) return { error: ERRORS.AUTH.UNAUTHORIZED };
    return { data: mapUserRpc(user) }; // user: Partial<UserInfo> & { id: string }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

// src/modules/auth/rpc/actions.ts
"use server";
import { getUserInfo } from "@/modules/user";
import { ERRORS } from "@/config";
import { mapClientUser } from "@attendancy/user";

// Conservé uniquement pour apps/desktop en attendant sa migration vers useAuthUser.
export async function getCurrentUserAction() {
  try {
    const user = await getUserInfo();
    if (!user) return { error: ERRORS.AUTH.UNAUTHORIZED };
    // user: UserInfo (id garanti) ; le client reçoit ClientUser, filtré par CLIENT_USER_KEYS
    return { data: mapClientUser(user) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}
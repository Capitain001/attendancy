// src/modules/auth/rpc/actions.ts
"use server";
import { getUserInfo } from "@/modules/user";
import { ERRORS } from "@/config";
import { mapUserRpc } from "./utils";

export async function getCurrentUserAction() {
  try {
    const user = await getUserInfo();
    if (!user) return { error: ERRORS.AUTH.UNAUTHORIZED };
    // user: UserInfo (id garanti) ; le client reçoit RpcUser, filtré par RPC_USER_KEYS
    return { data: mapUserRpc(user) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}
"use server";
import { getUserInfo } from "@/modules/user";
import { ERRORS } from "@/config";
import { mapUserRpc } from "./utils";

export async function getCurrentUserAction() {
  try {
    const user = await getUserInfo();
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED };

    return { data: mapUserRpc(user) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

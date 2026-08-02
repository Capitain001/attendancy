"use server";


import { redirect } from "next/navigation";
import { getUserInfo, removeUser, setUserInfo } from "@/services/user";
import { logout } from "../supabase";


export async function logoutAction({ userId }: { userId?: string }) {
  setImmediate(async () => {
    await setUserInfo({ isConnected: false });
  });

  if (userId) {
    removeUser(userId);
  }

  await logout()
    redirect('/login')
}

export async function logoutActionForm(formData: FormData) {
  const userId = formData.get("userId") as string | null;
  return logoutAction({ userId: userId || undefined });
}
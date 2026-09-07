//src/modules/auth/actions/logout.ts
"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {  removeUser, setUserInfo } from "@/modules/user";
import { endSessionOnLogoutAction } from "@/services/device";
import { logout } from "../supabase";
 
export async function logoutAction({ userId }: { userId?: string }) {
  await setUserInfo({ isConnected: false });
  //retire l user du cache serveur
  if (userId) {
    removeUser(userId);
 
    // Clôture (EXPIRED, pas REVOKED) de la session sur cet appareil —
    // best-effort, ne bloque jamais le logout.
    const cookieStore = await cookies();
    const deviceId = cookieStore.get("device_id")?.value;
    if (deviceId) {
      await endSessionOnLogoutAction({ userId, deviceId });
    }
  }
  await logout();
  redirect('/login');
}
 
export async function logoutActionForm(formData: FormData) {
  const userId = formData.get('userId') as string | null;
  await logoutAction({ userId: userId || undefined });
}
 
//src/modules/auth/actions/logout.ts
"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUserInfo } from "@/modules/user";
import { removeUser, setUserInfo } from "@/modules/user/server";
import { endSessionForUser } from "@/services/device/server/device-session";
import { logout } from "../supabase";
 
export async function logoutAction() {
  const user = await getUserInfo()
  const userId = user?.id
  await setUserInfo({ isConnected: false });
  //retire l user du cache serveur
  if (userId) {
    removeUser(userId);
 
    // Clôture (EXPIRED, pas REVOKED) de la session sur cet appareil —
    // best-effort, ne bloque jamais le logout.
    const cookieStore = await cookies();
    const deviceId = cookieStore.get("device_id")?.value;
    if (deviceId) {
      try {
        const result = await endSessionForUser({ userId, deviceId });
        if ('error' in result) console.warn('[logout] session non clôturée:', result.error)
      } catch (error) {
        console.warn('[logout] session non clôturée:', error)
      }
    }
  }
  await logout();
  redirect('/login');
}
 
export async function logoutActionForm(_formData: FormData) {
  await logoutAction();
}
 
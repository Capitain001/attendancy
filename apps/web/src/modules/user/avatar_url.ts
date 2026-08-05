// src/services/users/avatar_url.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { setUserInfo } from "./update";
import { getUserInfo } from "./userInfo";
import { ERRORS } from "@/config";

export async function updateAvatar(avatarUrl: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id || !user?.email) return { error: ERRORS.AUTH.UNAUTHORIZED }

    await setUserInfo({ avatar_url: avatarUrl })

    await prisma.user.upsert({
      where: { email: user.email },
      update: { avatar_url: avatarUrl },
      create: {
        id: user.id,
        email: user.email,
        avatar_url: avatarUrl,
        firstName: user.name || " ",
        lastName: user.name || " ",
      },
    })

    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}



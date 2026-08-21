import { prisma } from "@/lib/prisma";
import { tryConstraint } from "@/utils/server/prisma";
import { invalidateEvent } from "@/cache/server/key";
import type { UpdateCurrentUserOutput } from "../validation";

export async function updateUserProfile(userId: string, data: UpdateCurrentUserOutput, orgId: string) {
  const result = await tryConstraint(
    prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, firstName: true, lastName: true },
    }),
  );
  await invalidateEvent("USER_UPDATED", orgId, userId);
  return result;
}


export async function updateUser(userId: string, data: UpdateCurrentUserOutput, orgId: string) {
  const result = await tryConstraint(
    prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true },
    }),
  );
  await invalidateEvent("USER_UPDATED", orgId, userId);
  return result;
}

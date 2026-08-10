// src/services/parent/notifications.ts
//
// Émission serveur des notifications vers les PARENTS (Lot P5).
// Gate P-13 : conditionné à `OrganizationSettings.parentalNotifications`.
// Best-effort, hors transaction — un échec de push n'annule jamais l'acte métier.

import type { NotificationType } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import { sendPushNotificationById } from '@/modules/notification/action'
import { getParentUserIdsForStudents } from "./database";

export async function notifyParentsForStudents(
  studentIds: string[],
  orgId: string,
  data: { message: string; type?: NotificationType; scheduleId?: string },
): Promise<void> {
  if (studentIds.length === 0) return;

  // Gate org (P-13) : l'établissement décide si les parents sont notifiés.
  const settings = await prisma.organizationSettings.findUnique({
    where: { orgId },
    select: { parentalNotifications: true },
  });
  if (!settings?.parentalNotifications) return;

  const parentUserIds = await getParentUserIdsForStudents(studentIds, orgId);
  if (parentUserIds.length === 0) return;

  const results = await Promise.allSettled(
    parentUserIds.map((userId) => sendPushNotificationById(userId, data)),
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) {
    console.warn(`[notifyParentsForStudents] ${failed} notif(s) parent non envoyée(s)`);
  }
}

import { getOrgParentalNotifications } from "@/services/organization/server";
import { getParentUserIds } from "@/services/parent/server";

export async function resolveScheduleParents(
  studentIds: string[],
  orgId: string,
): Promise<string[]> {
  if (studentIds.length === 0) return [];
  try {
    const settings = await getOrgParentalNotifications(orgId);
    if (!settings?.parentalNotifications) return [];

    return await getParentUserIds(studentIds, orgId);
  } catch (error) {
    console.error("[resolveScheduleParents] Résolution des parents échouée:", error);
    return [];
  }
}

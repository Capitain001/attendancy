import "server-only";

import { getOrgParentalNotifications } from "@/services/organization/server";
import { getParentUserIdsForStudents } from "./database";

export async function getNotifiableParentUserIdsForStudents(
  studentIds: string[],
  orgId: string,
): Promise<string[]> {
  if (studentIds.length === 0) return [];

  const settings = await getOrgParentalNotifications(orgId);
  if (!settings?.parentalNotifications) return [];

  return getParentUserIdsForStudents(studentIds, orgId);
}

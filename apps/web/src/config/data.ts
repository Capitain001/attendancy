// src/config/data.ts
//src/config/data.ts

import { RESOURCE_ICONS, ResourceIconName } from "@/components/icons/generated"

export { RESOURCE_ICONS, type ResourceIconName }

export const CONFIG = {
  EARLY_CHECK_IN_MINUTES: 15,
  MAX_LATE_CHECK_IN_MINUTES: 30,
  REFETCH_INTERVAL: 2 * 60 * 1000, // 2 minutes
  TIME_UPDATE_INTERVAL: 60000, // 1 minute
};

export const RESOURCE_BASE_PATH = "/assets/resources" as const

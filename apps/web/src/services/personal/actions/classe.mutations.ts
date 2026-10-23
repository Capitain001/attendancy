import { getClassesAction } from "@/services/class";
import { checkClassQuotaLimitAction } from "@/services/organization";
import { actionData, isError } from "@/utils/server/utils";

const EMPTY_QUOTA = { activeCount: 0, maxClasses: null, limitReached: false };

export async function resolveClassesData() {
  const [classesRes, quotaRes] = await Promise.all([
    getClassesAction(),
    checkClassQuotaLimitAction(),
  ]);

  const loadError = isError(classesRes) || isError(quotaRes);
  const quota = await actionData(quotaRes, { fallback: EMPTY_QUOTA });

  return {
    classes: await actionData(classesRes, { fallback: [] }),
    quota,
    loadError,
    canAddClass: !loadError && !quota?.limitReached,
  };
}

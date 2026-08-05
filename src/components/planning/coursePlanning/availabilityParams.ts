import type { UseAvailabilityParams } from "@/hooks/planning/useAvailability";
import type { PlanningResources } from "@/services/planning";

import type { CoursePlanningFormState } from "../types";
import { NO_GROUP } from "./constants";
import { flattenTeacherIdsForAvailability, roomsForAvailability } from "./resourceMaps";
import { computeSlotFromFormTimes } from "./timeRange";

export function buildUseAvailabilityParams(input: {
  form: CoursePlanningFormState;
  classId: string;
  resources: NonNullable<PlanningResources>;
  excludeScheduleId?: string;
}): Pick<
  UseAvailabilityParams,
  "start" | "end" | "rooms" | "teachers" | "classes" | "groups" | "excludeScheduleId"
> {
  const { form, classId, resources, excludeScheduleId } = input;
  const slot = computeSlotFromFormTimes(form.startDate, form.startTime, form.endTime);

  return {
    start: slot?.start,
    end: slot?.end,
    rooms: roomsForAvailability(resources.rooms),
    teachers: flattenTeacherIdsForAvailability(resources.courses),
    classes: [{ id: classId }],
    groups: form.groupId !== NO_GROUP ? [{ id: form.groupId }] : [],
    excludeScheduleId,
  };
}

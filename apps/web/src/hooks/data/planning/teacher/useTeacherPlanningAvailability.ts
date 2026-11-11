// src/hooks/data/planning/teacher/useTeacherPlanningAvailability.ts
"use client";

import { useMemo } from "react";
import type { ScheduleEvent } from "@/components/event-calendar";
import { buildUseAvailabilityParams } from "@/components/planning/coursePlanning";
import type { CoursePlanningFormState } from "@/components/planning/types";
import { useAvailability } from "@/hooks/data/planning/useAvailability";
import type { PlanningResources } from "@/services/planning";

export function useTeacherPlanningAvailability(params: {
  form: CoursePlanningFormState;
  classId: string;
  resources: NonNullable<PlanningResources>;
  event: ScheduleEvent | null;
  enabled: boolean;
}) {
  const { form, classId, resources, event, enabled } = params;

  const availabilityInput = useMemo(
    () =>
      buildUseAvailabilityParams({
        form,
        classId,
        resources,
        excludeScheduleId: event?.id || undefined,
      }),
    [form, classId, resources, event?.id]
  );

  return useAvailability({
    start: availabilityInput.start,
    end: availabilityInput.end,
    excludeScheduleId: availabilityInput.excludeScheduleId,
    rooms: availabilityInput.rooms,
    teachers: availabilityInput.teachers,
    classes: availabilityInput.classes,
    groups: availabilityInput.groups,
    enabled,
  });
}


import type { ScheduleEvent } from "@/components/event-calendar/types";
import type { PlanningFilters } from "@/hooks/data/planning/usePlanningFilters";

function inSet(selected: string[], value?: string | null): boolean {
  return selected.length === 0 || (value != null && selected.includes(value));
}

export function matchesPlanningFilters(
  meta: ScheduleEvent["meta"],
  f: PlanningFilters
): boolean {
  return (
    inSet(f.classIds, meta.classId) &&
    inSet(f.groupIds, meta.groupId) &&
    inSet(f.teacherIds, meta.teacherId) &&
    inSet(f.roomIds, meta.roomId) &&
    inSet(f.statuses, meta.status)
  );
}

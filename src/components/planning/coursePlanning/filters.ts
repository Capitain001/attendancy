import type { CourseTeacherItem } from "@/components/users/SelectCourseTeachers";

import type { PlanningCourseRow, PlanningRoomRow } from "../types";

export type LabeledSelectOption = { value: string; label: string; disabled?: boolean };

export function buildCourseSelectOptions(courses: PlanningCourseRow[]): LabeledSelectOption[] {
  return courses.map((c) => ({ value: c.id, label: c.name ?? "—" }));
}

export function buildRoomSelectOptions(
  rooms: PlanningRoomRow[],
  isRoomAvailable: (roomId: string) => boolean
): LabeledSelectOption[] {
  return rooms.map((r) => {
    const available = isRoomAvailable(r.id);
    return {
      value: r.id,
      label: available ? r.name : `${r.name} (Occupée)`,
      disabled: !available,
    };
  });
}

export function buildTeacherCardItems(
  teachers: PlanningCourseRow["teachers"],
  isTeacherAvailable: (teacherId: string) => boolean,
  courseDurationHours: number
): CourseTeacherItem[] {
  const defaultHours = teachers.length
    ? Math.max(1, Math.round((courseDurationHours || 0) / teachers.length))
    : 0;

  return teachers.map((t, index) => ({
    id: t.id,
    name: isTeacherAvailable(t.id)
      ? (t.name ?? t.email ?? t.id)
      : `${t.name ?? t.email ?? t.id} (Indisponible)`,
    email: t.email,
    avatar_url: t.avatar_url ?? null,
    hours: defaultHours,
    isMain: index === 0,
  }));
}

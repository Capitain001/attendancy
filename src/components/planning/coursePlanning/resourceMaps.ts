import type { PlanningCourseRow, PlanningRoomRow, PlanningTeacherRow } from "../types";

export function buildCourseMap(courses: PlanningCourseRow[]): Map<string, PlanningCourseRow> {
  const map = new Map<string, PlanningCourseRow>();
  for (const c of courses) map.set(c.id, c);
  return map;
}

export function buildRoomMap(rooms: PlanningRoomRow[]): Map<string, PlanningRoomRow> {
  const map = new Map<string, PlanningRoomRow>();
  for (const r of rooms) map.set(r.id, r);
  return map;
}

export function buildAllTeachersMap(courses: PlanningCourseRow[]): Map<string, PlanningTeacherRow> {
  const map = new Map<string, PlanningTeacherRow>();
  for (const course of courses) {
    for (const teacher of course.teachers) {
      map.set(teacher.id, teacher);
    }
  }
  return map;
}

export function flattenTeacherIdsForAvailability(courses: PlanningCourseRow[]): { id: string }[] {
  const ids: { id: string }[] = [];
  const seen = new Set<string>();
  for (const course of courses) {
    for (const t of course.teachers) {
      if (t.id && !seen.has(t.id)) {
        seen.add(t.id);
        ids.push({ id: t.id });
      }
    }
  }
  return ids;
}

export function roomsForAvailability(rooms: PlanningRoomRow[]): { id: string }[] {
  return rooms.filter((r) => !!r.id).map((r) => ({ id: r.id }));
}


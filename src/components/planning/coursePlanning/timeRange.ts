import { isBefore } from "date-fns";

import type { CoursePlanningCardUpdatePatch } from "../types";

export type TimeOption = { value: string; label: string };

export function formatTimeForInput(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = Math.floor(date.getMinutes() / 15) * 15;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

export function buildTimeOptions(startHour: number, endHour: number): TimeOption[] {
  const opts: TimeOption[] = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    const h = hour.toString().padStart(2, "0");
    for (let minute = 0; minute < 60; minute += 15) {
      const m = minute.toString().padStart(2, "0");
      const time = `${h}:${m}`;
      opts.push({ value: time, label: time });
    }
  }
  return opts;
}

export type SlotRange = { start: Date; end: Date };

export function computeSlotFromFormTimes(
  startDate: Date,
  startTime: string,
  endTime: string
): SlotRange | null {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  if (sh === eh && sm === em) return null;

  const start = new Date(startDate);
  start.setHours(sh, sm, 0, 0);

  const end = new Date(startDate);
  end.setHours(eh, em, 0, 0);

  if (start >= end) return null;

  return { start, end };
}

export function resolveTimeUpdateAgainstGrid(
  data: CoursePlanningCardUpdatePatch,
  currentEndTime: string,
  timeOptions: Pick<TimeOption, "value">[]
): CoursePlanningCardUpdatePatch {
  if (!data.startTime) return data;

  const startIndex = timeOptions.findIndex((o) => o.value === data.startTime);
  const endTime = data.endTime ?? currentEndTime;
  const endIndex = timeOptions.findIndex((o) => o.value === endTime);

  if (startIndex < 0 || endIndex < 0) return data;

  if (startIndex >= endIndex) {
    const autoEnd =
      timeOptions[startIndex + 4]?.value ??
      timeOptions[timeOptions.length - 1]?.value ??
      endTime;
    return { ...data, endTime: autoEnd };
  }

  return data;
}

export function assertEndNotBeforeStart(slot: SlotRange): boolean {
  return !isBefore(slot.end, slot.start);
}

import { eachDayOfInterval, endOfWeek, isSameDay, startOfWeek } from "date-fns";

import type {
  ScheduleEvent,
  EventColor,
} from "@/components/event-calendar/types";
import { WEEK_STARTS_ON } from "@/components/event-calendar/constants";

/**
 * Début de semaine, selon le réglage global WEEK_STARTS_ON.
 * Évite de disperser `{ weekStartsOn: 1 }` dans chaque vue.
 */
export const getWeekStart = (date: Date): Date =>
  startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });

/** Fin de semaine, selon WEEK_STARTS_ON. */
export const getWeekEnd = (date: Date): Date =>
  endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });

/** Les 7 jours de la semaine contenant `date`. */
export const getWeekDays = (date: Date): Date[] =>
  eachDayOfInterval({ start: getWeekStart(date), end: getWeekEnd(date) });

export const colorOptions: Array<{
  value: EventColor;
  label: string;
  bgClass: string;
  borderClass: string;
}> = [
  {
    value: "sky",
    label: "Sky",
    bgClass: "bg-sky-400 data-[state=checked]:bg-sky-400",
    borderClass: "border-sky-400 data-[state=checked]:border-sky-400",
  },
  {
    value: "amber",
    label: "Amber",
    bgClass: "bg-amber-400 data-[state=checked]:bg-amber-400",
    borderClass: "border-amber-400 data-[state=checked]:border-amber-400",
  },
  {
    value: "violet",
    label: "Violet",
    bgClass: "bg-violet-400 data-[state=checked]:bg-violet-400",
    borderClass: "border-violet-400 data-[state=checked]:border-violet-400",
  },
  {
    value: "rose",
    label: "Rose",
    bgClass: "bg-rose-400 data-[state=checked]:bg-rose-400",
    borderClass: "border-rose-400 data-[state=checked]:border-rose-400",
  },
  {
    value: "emerald",
    label: "Emerald",
    bgClass: "bg-emerald-400 data-[state=checked]:bg-emerald-400",
    borderClass: "border-emerald-400 data-[state=checked]:border-emerald-400",
  },
  {
    value: "orange",
    label: "Orange",
    bgClass: "bg-orange-400 data-[state=checked]:bg-orange-400",
    borderClass: "border-orange-400 data-[state=checked]:border-orange-400",
  },
  {
    value: "gray",
    label: "Disabled",
    bgClass: "bg-gray-300 opacity-50 data-[state=checked]:bg-gray-300",
    borderClass: "border-gray-300 data-[state=checked]:border-gray-300",
  },
];


/**
 * Get CSS classes for event colors
 */
export function getEventColorClasses(color?: EventColor | string): string {
  const eventColor = color || "sky";

  switch (eventColor) {
    case "sky":
      return "bg-sky-200/50 hover:bg-sky-200/40 text-sky-950/80 dark:bg-sky-400/25 dark:hover:bg-sky-400/20 dark:text-sky-200 shadow-sky-700/8";
    case "amber":
      return "bg-amber-200/50 hover:bg-amber-200/40 text-amber-950/80 dark:bg-amber-400/25 dark:hover:bg-amber-400/20 dark:text-amber-200 shadow-amber-700/8";
    case "violet":
      return "bg-violet-200/50 hover:bg-violet-200/40 text-violet-950/80 dark:bg-violet-400/25 dark:hover:bg-violet-400/20 dark:text-violet-200 shadow-violet-700/8";
    case "rose":
      return "bg-rose-200/50 hover:bg-rose-200/40 text-rose-950/80 dark:bg-rose-400/25 dark:hover:bg-rose-400/20 dark:text-rose-200 shadow-rose-700/8";
    case "emerald":
      return "bg-emerald-200/50 hover:bg-emerald-200/40 text-emerald-950/80 dark:bg-emerald-400/25 dark:hover:bg-emerald-400/20 dark:text-emerald-200 shadow-emerald-700/8";
    case "orange":
      return "bg-orange-200/50 hover:bg-orange-200/40 text-orange-950/80 dark:bg-orange-400/25 dark:hover:bg-orange-400/20 dark:text-orange-200 shadow-orange-700/8";
    default:
      return "bg-sky-200/50 hover:bg-sky-200/40 text-sky-950/80 dark:bg-sky-400/25 dark:hover:bg-sky-400/20 dark:text-sky-200 shadow-sky-700/8";
  }
}

/**
 * Get CSS classes for border radius based on event position in multi-day events
 */
export function getBorderRadiusClasses(
  isFirstDay: boolean,
  isLastDay: boolean,
): string {
  if (isFirstDay && isLastDay) {
    return "rounded"; // Both ends rounded
  } else if (isFirstDay) {
    return "rounded-l rounded-r-none"; // Only left end rounded
  } else if (isLastDay) {
    return "rounded-r rounded-l-none"; // Only right end rounded
  } else {
    return "rounded-none"; // No rounded corners
  }
}

/**
 * Check if an event is a multi-day event
 */
export function isMultiDayEvent(event: ScheduleEvent): boolean {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  // Determine if all-day by checking if start is at 00:00:00 and end is at 23:59:59
  const isAllDay = 
    eventStart.getHours() === 0 && 
    eventStart.getMinutes() === 0 && 
    eventStart.getSeconds() === 0 &&
    eventEnd.getHours() === 23 && 
    eventEnd.getMinutes() === 59 && 
    eventEnd.getSeconds() === 59;
  return isAllDay || eventStart.getDate() !== eventEnd.getDate();
}

/**
 * Check if an event is an all-day event
 */
export function isAllDayEvent(event: ScheduleEvent): boolean {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  return (
    eventStart.getHours() === 0 && 
    eventStart.getMinutes() === 0 && 
    eventStart.getSeconds() === 0 &&
    eventEnd.getHours() === 23 && 
    eventEnd.getMinutes() === 59 && 
    eventEnd.getSeconds() === 59
  );
}

/**
 * Filter events for a specific day
 */
export function getEventsForDay(
  events: ScheduleEvent[],
  day: Date,
): ScheduleEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      return isSameDay(day, eventStart);
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Sort events with multi-day events first, then by start time
 */
export function sortEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);

    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
}

/**
 * Get multi-day events that span across a specific day (but don't start on that day)
 */
export function getSpanningEventsForDay(
  events: ScheduleEvent[],
  day: Date,
): ScheduleEvent[] {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Only include if it's not the start day but is either the end day or a middle day
    return (
      !isSameDay(day, eventStart) &&
      (isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd))
    );
  });
}

/**
 * Get all events visible on a specific day (starting, ending, or spanning)
 */
export function getAllEventsForDay(
  events: ScheduleEvent[],
  day: Date,
): ScheduleEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (
      isSameDay(day, eventStart) ||
      isSameDay(day, eventEnd) ||
      (day > eventStart && day < eventEnd)
    );
  });
}

/**
 * Get all events for a day (for agenda view)
 */
export function getAgendaEventsForDay(
  events: ScheduleEvent[],
  day: Date,
): ScheduleEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        (day > eventStart && day < eventEnd)
      );
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

import type { ScheduleStatus } from "@/generated/prisma";
import type { ScheduleEvent, EventColor } from "@/components/event-calendar/types";

const STATUS_COLOR: Record<ScheduleStatus, EventColor> = {
  PENDING: "sky",
  COMPLETED: "gray",
  CANCELED: "red",
  MISSED: "rose",
};

export type ScheduleRow = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: ScheduleStatus;
  confirmed: boolean;
  notes: string | null;

  courseId: string;
  teacherId: string;
  roomId: string;
  classId: string;
  groupId: string | null;

  course: { id: string; name: string };
  room: { id: string; name: string };

  teacher: {
    id: string;
    user: {
      firstName: string | null;
      lastName: string | null;
    };
  } | null;

  group: { id: string; name: string } | null;
};

export function statusToColor(status: ScheduleStatus): EventColor {
  return STATUS_COLOR[status] ?? "blue";
}

export function mapScheduleToEvent(schedule: ScheduleRow): ScheduleEvent {
  return {
    id: schedule.id,
    title: schedule.course.name,
    start: schedule.startTime,
    end: schedule.endTime,
    color: statusToColor(schedule.status),
    description: schedule.notes ?? undefined,
    location: schedule.room.name,
    meta: {
      classId: schedule.classId,
      courseId: schedule.courseId,
      teacherId: schedule.teacherId,
      roomId: schedule.roomId,
      groupId: schedule.groupId ?? undefined,
      status: schedule.status,
      confirmed: schedule.confirmed,
    },
  };
}

export function getScheduleChanges(prev: ScheduleEvent, next: ScheduleEvent) {
  const changes: string[] = [];
  if (prev.start !== next.start || prev.end !== next.end) changes.push("horaire");
  if (prev.meta.roomId !== next.meta.roomId) changes.push("salle");
  if (prev.meta.teacherId !== next.meta.teacherId) changes.push("enseignant");
  if (prev.meta.courseId !== next.meta.courseId) changes.push("cours");
  return changes;
}

function formatSlot(dateStart: Date, dateEnd: Date): string {
  const day = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(dateStart);
  const start = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(dateStart);
  const end = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(dateEnd);
  return `${day} ${start} - ${end}`;
}

export type ScheduleMoveChange = {
  courseName: string;
  fromDay?: string;
  fromTime?: string;
  toDay: string;
  toTime: string;
};

function formatDayLong(date: Date): string {
  const day = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatTimeRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function buildScheduleMoveChange(
  previous: ScheduleEvent | null,
  next: ScheduleEvent
): ScheduleMoveChange {
  const courseName = next.title || previous?.title || "Cours";
  const nextStart = new Date(next.start);
  const nextEnd = new Date(next.end);
  return {
    courseName,
    fromDay: previous ? formatDayLong(new Date(previous.start)) : undefined,
    fromTime: previous
      ? formatTimeRange(new Date(previous.start), new Date(previous.end))
      : undefined,
    toDay: formatDayLong(nextStart),
    toTime: formatTimeRange(nextStart, nextEnd),
  };
}

export function buildScheduleMoveToastContent(
  previous: ScheduleEvent | null,
  next: ScheduleEvent
) {
  const courseName = next.title || previous?.title || "Cours";
  if (!previous) {
    return {
      title: `Confirmer le déplacement de ${courseName} ?`,
      description: `Nouveau: ${formatSlot(new Date(next.start), new Date(next.end))}`,
    };
  }
  return {
    title: `Confirmer le déplacement de ${courseName} ?`,
    description: `Actuel: ${formatSlot(new Date(previous.start), new Date(previous.end))}\nNouveau: ${formatSlot(new Date(next.start), new Date(next.end))}`,
  };
}

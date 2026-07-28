import type { ScheduleStatus } from "@/generated/prisma";

export type CalendarView = "month" | "week" | "day" | "agenda";

/** Origine d'une mise à jour d'événement : glisser-déposer vs formulaire d'édition. */
export type ScheduleUpdateSource = "dnd" | "form";

export type ScheduleEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: EventColor;
  description?: string;
  location?: string;
  meta: {
    ruleId?: string;
    classId?: string;
    courseId: string;
    teacherId: string;
    roomId?: string;
    groupId?: string;
    status?: ScheduleStatus;
    confirmed?: boolean;
  };
};




export type EventColor =
  | "sky"
  | "amber"
  | "violet"
  | "rose"
  | "emerald"
  | "orange"
  | "green"
  | "red"
  | "blue"
  | "gray"


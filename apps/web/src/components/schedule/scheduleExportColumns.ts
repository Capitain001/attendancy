import { format } from "date-fns";

import type { ExportColumn } from "@/lib/export";
import type { GetSchedulesReturn } from "@/services/schedule";

export type ScheduleExportRow = GetSchedulesReturn[number];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "À venir",
  COMPLETED: "Terminée",
  CANCELED: "Annulée",
  MISSED: "Manquée",
};

function teacherName(teacher: ScheduleExportRow["teacher"]): string {
  if (!teacher) return "—";
  return (
    [teacher.user.firstName, teacher.user.lastName].filter(Boolean).join(" ").trim() ||
    "—"
  );
}

export const SCHEDULE_EXPORT_COLUMNS: ExportColumn<ScheduleExportRow>[] = [
  { header: "Date", value: (s) => format(new Date(s.startTime), "yyyy-MM-dd") },
  { header: "Heure début", value: (s) => format(new Date(s.startTime), "HH:mm") },
  { header: "Heure fin", value: (s) => format(new Date(s.endTime), "HH:mm") },
  { header: "Cours", value: (s) => s.course.name },
  { header: "Classe / Groupe", value: (s) => s.group?.name ?? s.class.name },
  { header: "Salle", value: (s) => s.room.name },
  { header: "Enseignant", value: (s) => teacherName(s.teacher) },
  { header: "Statut", value: (s) => STATUS_LABEL[s.status] ?? s.status },
];

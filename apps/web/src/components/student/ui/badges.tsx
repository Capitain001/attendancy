import type { AttendanceStatus } from "@/generated/prisma/client";

import { cn } from "@/lib/utils";
import {
  SCHEDULE_UI_STATUS_LABEL,
  type ScheduleUiStatus,
} from "@/services/schedule/policy";

/**
 * Badges de statut de l'espace étudiant (P-27) : libellé + couleur, jamais couleur seule (a11y).
 * ⚠ Statut séance = `ScheduleUiStatus` (dérivé via `resolveScheduleUiStatus`), pas le `ScheduleStatus` DB brut.
 */

const SCHEDULE_CLASSNAME: Record<ScheduleUiStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  ONGOING: "bg-amber-500/15 text-amber-600",
  COMPLETED: "bg-sky-500/15 text-sky-600",
  CANCELED: "bg-red-500/15 text-red-600",
  MISSED: "bg-red-500/15 text-red-600",
};

export function ScheduleStatusBadge({
  status,
  className,
}: {
  status: ScheduleUiStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
        SCHEDULE_CLASSNAME[status],
        className,
      )}
    >
      {SCHEDULE_UI_STATUS_LABEL[status]}
    </span>
  );
}

export const ATTENDANCE_META: Record<
  AttendanceStatus,
  { label: string; className: string; dot: string }
> = {
  PRESENT: { label: "Présent", className: "bg-emerald-500/15 text-emerald-600", dot: "bg-emerald-500" },
  ABSENT: { label: "Absent", className: "bg-red-500/15 text-red-600", dot: "bg-red-500" },
  LATE: { label: "En retard", className: "bg-amber-500/15 text-amber-600", dot: "bg-amber-500" },
  EXCUSED: { label: "Excusé", className: "bg-sky-500/15 text-sky-600", dot: "bg-sky-500" },
  PENDING: { label: "En attente", className: "bg-blue-500/10 text-blue-600", dot: "bg-blue-500" },
};

export function AttendanceStatusBadge({
  status,
  className,
}: {
  status: AttendanceStatus;
  className?: string;
}) {
  const meta = ATTENDANCE_META[status];
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

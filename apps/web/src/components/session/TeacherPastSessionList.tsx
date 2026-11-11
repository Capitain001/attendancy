// src/components/session/TeacherPastSessionList.tsx
// apps/web/src/components/personal/teacher/sessions/TeacherPastSessionList.tsx
import Link from "next/link";

import {
  computeAttendanceRate,
  type AttendanceCounts,
} from "@/services/attendance/policy";
import { GetTeacherPastSessionsDto } from "@/services/session";

type PastSession = GetTeacherPastSessionsDto["sessions"][number];

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
const timeFormat = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" });

function countStatuses(attendances: PastSession["schedule"]["attendances"]) {
  return attendances.reduce<AttendanceCounts>((acc, { status }) => {
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
}

export function TeacherPastSessionList({
  sessions,
  slug,
}: {
  sessions: PastSession[];
  slug: string;
}) {
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune session passée.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {sessions.map(({ id, status, schedule }) => {
        const { attended, total, rate } = computeAttendanceRate(
          countStatuses(schedule.attendances),
        );

        return (
          <li key={id}>
            <Link
              href={`/personal/${encodeURIComponent(slug)}/teacher/sessions/${id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{schedule.course.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {schedule.class.name}
                  {schedule.group && ` · ${schedule.group.name}`}
                  {schedule.room && ` · ${schedule.room.name}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  <time dateTime={schedule.startTime.toISOString()}>
                    {dateFormat.format(schedule.startTime)}
                  </time>
                  {" · "}
                  {timeFormat.format(schedule.startTime)} – {timeFormat.format(schedule.endTime)}
                </p>
              </div>

              <div className="shrink-0 text-right">
                {status === "CANCELED" ? (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                    Annulée
                  </span>
                ) : (
                  <>
                    <p className="text-sm font-medium tabular-nums">
                      {attended}/{total}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {rate === null ? "—" : `${rate} %`}
                    </p>
                  </>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
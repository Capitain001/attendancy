"use client";

// Dialog de détail d'une séance (planning étudiant) — LECTURE SEULE.
// Branché via `renderEventDialog` de l'EventCalendar.

import { useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, GraduationCap, MapPin } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AttendanceStatusBadge } from "@/components/student/ui/badges";
import type { EventDialogRendererProps } from "@/components/event-calendar";
import { resolveScheduleUiStatus } from "@/services/schedule/policy";
import { getStudentSessionDetailAction } from "@/services/student";
import type { GetStudentSessionDetailDto } from "@/services/student";
import { cn } from "@/lib/utils";

type Detail = NonNullable<GetStudentSessionDetailDto>;

/** Chargeur de détail (injectable) : étudiant courant par défaut, parent l'override. */
type LoadDetail = (
  scheduleId: string,
) => Promise<{ data?: Detail | null; error?: string }>;

const UI_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING: { label: "À venir", className: "bg-muted text-muted-foreground" },
  ONGOING: { label: "En cours", className: "bg-emerald-500/15 text-emerald-600" },
  COMPLETED: { label: "Terminé", className: "bg-sky-500/15 text-sky-600" },
  CANCELED: { label: "Annulé", className: "bg-red-500/15 text-red-600" },
  MISSED: { label: "Manqué", className: "bg-amber-500/15 text-amber-600" },
};

function teacherName(t: Detail["schedule"]["teacher"]): string {
  if (!t) return "—";
  return [t.firstName, t.lastName].filter(Boolean).join(" ") || "—";
}

function teacherInitials(t: Detail["schedule"]["teacher"]): string {
  if (!t) return "?";
  return (
    [t.firstName?.[0], t.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"
  );
}

export function StudentSessionDialog({
  event,
  isOpen,
  onClose,
  loadDetail = (scheduleId) => getStudentSessionDetailAction({ scheduleId }),
}: EventDialogRendererProps & { loadDetail?: LoadDetail }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const loadRef = useRef(loadDetail);
  loadRef.current = loadDetail;

  const scheduleId = event?.id ?? null;

  useEffect(() => {
    if (!isOpen || !scheduleId) return;
    setDetail(null);
    setError(null);
    startTransition(async () => {
      const { error, data } = await loadRef.current(scheduleId);
      if (error) setError(error);
      else if (data) setDetail(data);
    });
  }, [isOpen, scheduleId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        <DialogTitle className="sr-only">Détail de la séance</DialogTitle>
        <DialogDescription className="sr-only">
          Informations de la séance, ma présence et le déroulé.
        </DialogDescription>

        {pending && <DialogSkeleton />}
        {!pending && error && <p className="p-6 text-sm text-muted-foreground">{error}</p>}
        {!pending && detail && <DialogBody detail={detail} />}
      </DialogContent>
    </Dialog>
  );
}

function DialogBody({ detail }: { detail: Detail }) {
  const { schedule, myAttendance, session, courseRate } = detail;
  const now = new Date();
  const ui = resolveScheduleUiStatus(
    { status: schedule.status, startTime: schedule.startTime, endTime: schedule.endTime },
    now,
  );
  const meta = UI_STATUS_LABEL[ui] ?? UI_STATUS_LABEL.PENDING;
  const isFuture = ui === "PENDING";
  const isCanceled = ui === "CANCELED";

  return (
    <div className={cn("flex flex-col", isCanceled && "opacity-90")}>
      <header className="border-b bg-muted/30 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {format(schedule.startTime, "EEEE d MMMM", { locale: fr })}
          </p>
          <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}>
            {meta.label}
          </span>
        </div>

        <h2 className="font-serif mt-1 text-xl leading-snug">{schedule.courseName}</h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-display tabular-nums">
            <Clock className="size-4" />
            {format(schedule.startTime, "HH:mm")}–{format(schedule.endTime, "HH:mm")}
          </span>
          {schedule.roomName && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" /> {schedule.roomName}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="size-4" /> {schedule.credits} crédits
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Avatar className="size-7">
            {schedule.teacher?.avatarUrl && (
              <AvatarImage src={schedule.teacher.avatarUrl} alt={teacherName(schedule.teacher)} />
            )}
            <AvatarFallback className="text-[10px]">
              {teacherInitials(schedule.teacher)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{teacherName(schedule.teacher)}</span>
        </div>
      </header>

      {isCanceled && (
        <p className="bg-red-500/5 px-5 py-2 text-xs font-medium text-red-600">
          Ce cours a été annulé.
        </p>
      )}

      <div className="flex flex-col gap-4 p-5">
        <section className="space-y-2">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Ma présence
          </h3>
          {isFuture ? (
            <p className="text-sm text-muted-foreground">
              Présence pas encore enregistrée — pense à scanner en cours.
            </p>
          ) : myAttendance ? (
            <div className="flex flex-col gap-2">
              <AttendanceStatusBadge status={myAttendance.status} />
              {myAttendance.notes && (
                <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  {myAttendance.notes}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune présence enregistrée pour cette séance.
            </p>
          )}

          {!isFuture && courseRate !== null && (
            <p className="text-xs text-muted-foreground">
              Mon assiduité sur ce cours :{" "}
              <span className="font-display font-medium tabular-nums text-foreground">
                {courseRate}%
              </span>
            </p>
          )}
        </section>

        {(schedule.notes || session?.isLate || schedule.confirmed) && (
          <section className="space-y-2 border-t pt-4">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Déroulé
            </h3>
            {schedule.notes && (
              <p className="rounded-lg bg-muted/50 p-3 text-sm">{schedule.notes}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {session?.isLate && <span>· Séance démarrée en retard</span>}
              {schedule.confirmed && <span>· Séance validée</span>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function DialogSkeleton() {
  return (
    <div className="animate-pulse p-5">
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="mt-2 h-6 w-2/3 rounded bg-muted" />
      <div className="mt-4 h-4 w-1/2 rounded bg-muted" />
      <div className="mt-6 h-20 w-full rounded-lg bg-muted" />
    </div>
  );
}

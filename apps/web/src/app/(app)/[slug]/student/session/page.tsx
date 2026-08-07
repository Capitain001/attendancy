// Séance en cours étudiant — visuel porté de la V1.
import { connection } from "next/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, MapPin, User } from "lucide-react";
import type { AttendanceStatus } from "@/generated/prisma/client";

import {
  getStudentProfileAction,
  getStudentActiveSessionAction,
} from "@/services/student";
import { StudentScanButton } from "@/components/student/session/StudentScanButton";
import { AttendanceStatusBadge, ATTENDANCE_META } from "@/components/student/ui/badges";
import {
  SessionPauseIllustration,
  StudentEmpty,
} from "@/components/student/ui/illustrations";
import { cn } from "@/lib/utils";

/** Texte rassurant par statut (P-25) — la pastille couleur vient du badge canonique. */
const PRESENCE_HINT: Record<AttendanceStatus, string> = {
  PENDING: "Ta présence a été enregistrée, en attente de validation par l'enseignant.",
  PRESENT: "Ta présence est confirmée.",
  LATE: "Présence confirmée, marquée en retard.",
  ABSENT: "Tu es marqué absent pour cette séance.",
  EXCUSED: "Absence justifiée.",
};

export default async function StudentSessionPage() {
  await connection();

  const profileRes = await getStudentProfileAction();
  if ("error" in profileRes) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{profileRes.error}</p>
      </div>
    );
  }

  const { classId, groupIds } = profileRes.data;
  if (!classId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Aucune classe associée</p>
      </div>
    );
  }

  const res = await getStudentActiveSessionAction({ classId, groupIds });
  if ("error" in res) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{res.error}</p>
      </div>
    );
  }
  const active = res.data;
  const now = new Date();

  const totalMs = active ? active.endTime.getTime() - active.startTime.getTime() : 0;
  const elapsedMs = active
    ? Math.min(Math.max(now.getTime() - active.startTime.getTime(), 0), totalMs)
    : 0;
  const progress = totalMs > 0 ? Math.round((elapsedMs / totalMs) * 100) : 0;
  const remainingMin = active
    ? Math.max(0, Math.round((active.endTime.getTime() - now.getTime()) / 60000))
    : 0;

  return (
    <div className="flex flex-col gap-6 pb-16">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display mt-1 text-4xl font-bold tracking-tight">
            {active ? "En direct" : "En pause"}
          </h1>
        </div>

        {active && (
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            En direct
          </span>
        )}
      </header>

      {!active ? (
        <StudentEmpty
          illustration={<SessionPauseIllustration />}
          title="Aucune séance en cours"
          hint="Quand un enseignant ouvre une séance pour ta classe, elle s'affiche ici avec le statut de ta présence."
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="h-1 w-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="p-5">
            <h2 className="font-serif text-2xl font-normal leading-tight">{active.course}</h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-display inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs tabular-nums text-muted-foreground">
                <Clock className="size-3.5" />
                {format(active.startTime, "HH:mm")} – {format(active.endTime, "HH:mm")}
              </span>
              {active.room && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {active.room}
                </span>
              )}
              {active.teacher && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  <User className="size-3.5" />
                  {active.teacher}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              {remainingMin > 0
                ? `Encore ${remainingMin} min · ${progress}% écoulé`
                : "Séance bientôt terminée"}
            </p>

            <div className="mt-5 border-t border-border/60 pt-4">
              {active.myAttendance ? (
                <PresenceState attendance={active.myAttendance} />
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Tu n&apos;as pas encore marqué ta présence.
                  </p>
                  <StudentScanButton />
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function PresenceState({
  attendance,
}: {
  attendance: { status: AttendanceStatus; recordedAt: Date };
}) {
  const meta = ATTENDANCE_META[attendance.status];
  return (
    <div className={cn("rounded-xl p-4", meta.className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} />
          Ma présence
        </span>
        <AttendanceStatusBadge status={attendance.status} className="bg-background/60" />
      </div>
      <p className="mt-2 text-sm">{PRESENCE_HINT[attendance.status]}</p>
      <p className="mt-1 text-xs opacity-70">
        Enregistré le {format(attendance.recordedAt, "d MMM 'à' HH:mm", { locale: fr })}
      </p>
    </div>
  );
}

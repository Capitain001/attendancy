// src/app/(app)/[slug]/student/session/page.tsx
// Séance en cours étudiant — mise en page typographique, sans cartes ni fonds.
import { connection } from "next/server";
import { format } from "date-fns";
import { Check, Clock, X } from "lucide-react";
import type { AttendanceStatus } from "@/generated/prisma/client";

import {
  getStudentProfileAction,
  getStudentActiveSessionAction,
} from "@/services/student";
import { StudentScanButton } from "@/components/student/session/StudentScanButton";
import { ATTENDANCE_META } from "@/components/student/ui/badges";
import {
  SessionPauseIllustration,
  StudentEmpty,
} from "@/components/student/ui/illustrations";
import { cn } from "@/lib/utils";

const PRESENCE_HINT: Record<AttendanceStatus, string> = {
  PENDING: "En attente de validation par l'enseignant.",
  PRESENT: "Ta présence est confirmée.",
  LATE: "Présence confirmée, marquée en retard.",
  ABSENT: "Tu es marqué absent pour cette séance.",
  EXCUSED: "Absence justifiée.",
};

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-3.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-base font-medium">{value}</dd>
    </div>
  );
}

export default async function StudentSessionPage() {
  await connection();

  const profileRes = await getStudentProfileAction();
  if ("error" in profileRes) return <Message>{profileRes.error}</Message>;

  const { classId, groupIds } = profileRes.data;
  if (!classId) return <Message>Aucune classe associée</Message>;

  const res = await getStudentActiveSessionAction({ classId, groupIds });
  if ("error" in res) return <Message>{res.error}</Message>;

  const active = res.data;

  if (!active) {
    return (
      <div className="flex flex-col gap-6 pb-16">
        <h1 className="font-display text-4xl font-bold tracking-tight">En pause</h1>
        <StudentEmpty
          illustration={<SessionPauseIllustration />}
          title="Aucune séance en cours"
          hint="Quand un enseignant ouvre une séance pour ta classe, elle s'affiche ici avec le statut de ta présence."
        />
      </div>
    );
  }

  const now = new Date();
  const totalMs = active.endTime.getTime() - active.startTime.getTime();
  const elapsedMs = Math.min(Math.max(now.getTime() - active.startTime.getTime(), 0), totalMs);
  const progress = totalMs > 0 ? Math.round((elapsedMs / totalMs) * 100) : 0;
  const remainingMin = Math.max(0, Math.round((active.endTime.getTime() - now.getTime()) / 60000));

  return (
    <div className="flex flex-col gap-10 pb-16">
      {/* En-tête */}
      <header className="space-y-4 ">
        {/* <div className="flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-widest text-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-foreground" />
            </span>
            Séance en cours
          </span>
          <span className="text-muted-foreground">
            {remainingMin > 0 ? `${remainingMin} min restantes` : "Bientôt terminée"}
          </span>
        </div> */}
        <h1 className="font-serif text-4xl mt-8 leading-tight">{active.course}</h1>
      </header>

      {/* Progression */}
      <section className="space-y-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between font-display text-sm font-medium tabular-nums">
          <span>{format(active.startTime, "HH:mm")}</span>
          <span>{format(active.endTime, "HH:mm")}</span>
        </div>
      </section>

      {/* Détails */}
      {(active.room || active.teacher) && (
        <dl className="border-t">
          {active.room && <Row label="Salle" value={active.room} />}
          {active.teacher && <Row label="Enseignant" value={active.teacher} />}
        </dl>
      )}

      {/* Présence */}
      <section>
        {active.myAttendance ? (
          <PresenceState attendance={active.myAttendance} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Tu n&apos;as pas encore marqué ta présence.</p>
            <StudentScanButton />
          </div>
        )}
      </section>
    </div>
  );
}

const PRESENCE_ICON: Record<AttendanceStatus, typeof Check> = {
  PENDING: Clock,
  PRESENT: Check,
  LATE: Check,
  ABSENT: X,
  EXCUSED: Check,
};

/** Nuances de gris uniquement : plein = confirmé, contour = en attente, doux = absent. */
const PRESENCE_TONE: Record<AttendanceStatus, string> = {
  PRESENT: "bg-foreground text-background",
  LATE: "bg-foreground text-background",
  EXCUSED: "bg-foreground/80 text-background",
  PENDING: "bg-muted  text-foreground/60",
  ABSENT: "bg-muted text-muted-foreground",
};

function PresenceState({
  attendance,
}: {
  attendance: { status: AttendanceStatus };
}) {
  const Icon = PRESENCE_ICON[attendance.status];
  return (
    <div className="flex flex-col items-center gap-4 pt-4 text-center">
      <span
        className={cn(
          "flex size-14 items-center justify-center rounded-full",
          PRESENCE_TONE[attendance.status],
        )}
      >
        <Icon className="size-7" strokeWidth={3} />
      </span>
      <p className="font-display text-2xl font-bold tracking-tight">
        {PRESENCE_HINT[attendance.status]}
      </p>
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        {ATTENDANCE_META[attendance.status].label}
      </p>
    </div>
  );
}
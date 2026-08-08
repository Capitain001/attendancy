"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  Radio,
  Users,
  CalendarOff,
  Loader2,
} from "lucide-react";

import { useNextSchedule } from "@/hooks/data/sessions/useNextSchedule";
import { useSessionState, type DBSession } from "@/hooks/data/sessions/use-session-state";
import { useStartSession } from "@/hooks/data/sessions/use-start-session";
import { useReference } from "@/hooks/utils/use-reference";
import { cn } from "@/lib/utils";
import type { UISessionStatus } from "@/services/session/policy";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NextSessionWidgetProps {
  teacherId: string;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(date: Date) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(minutes: number) {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return h > 0 ? `${h}h ${m < 10 ? `0${m}` : m}` : `${m}m`;
}

const STATUS_DOT: Record<UISessionStatus, string> = {
  upcoming:       "bg-muted-foreground/40",
  "can-check-in": "bg-amber-400",
  ongoing:        "bg-emerald-400 animate-pulse",
  "can-check-out":"bg-blue-400",
  done:           "bg-muted-foreground/30",
  missed:         "bg-red-400/60",
};

const STATUS_LABEL: Record<UISessionStatus, string> = {
  upcoming:       "À venir",
  "can-check-in": "Démarrage possible",
  ongoing:        "En cours",
  "can-check-out":"Clôture possible",
  done:           "Terminée",
  missed:         "Manquée",
};

// ─── Slide dots indicator ─────────────────────────────────────────────────────

function SlideDots({
  total,
  current,
  onChange,
}: {
  total: number;
  current: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={cn(
            "rounded-full transition-all duration-200",
            i === current
              ? "w-3 h-1.5 bg-foreground/70"
              : "w-1.5 h-1.5 bg-border hover:bg-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

// ─── Progress arc (SVG léger) ─────────────────────────────────────────────────

function ProgressArc({ percent }: { percent: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
      <circle
        cx="26" cy="26" r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-border"
      />
      <circle
        cx="26" cy="26" r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-info transition-all duration-1000"
      />
    </svg>
  );
}

// ─── Inner widget (schedule disponible) ──────────────────────────────────────

function WidgetInner({
  teacherId,
  schedule,
}: {
  teacherId: string;
  schedule: NonNullable<ReturnType<typeof useNextSchedule>["schedule"]>;
}) {
  const [slide, setSlide] = useState(0);

  // Dates stables
  const startAt = useReference(
    () => new Date(schedule.startTime),
    [schedule.startTime],
    (a, b) => a.getTime() === b.getTime(),
  );
  const endAt = useReference(
    () => new Date(schedule.endTime),
    [schedule.endTime],
    (a, b) => a.getTime() === b.getTime(),
  );

  // Session optimiste
  const [optimisticSession, setOptimisticSession] = useState<DBSession>(
    schedule.session,
  );
  useEffect(() => {
    setOptimisticSession(schedule.session);
  }, [schedule.id, schedule.session?.id, schedule.session?.status]);

  const { uiStatus, canCheckIn, canCheckOut, isLate, countdown } =
    useSessionState({ startTime: startAt, endTime: endAt, session: optimisticSession });

  const { startSession, endSession, isStarting, isEnding } = useStartSession({
    scheduleId: schedule.id,
    teacherId,
    onStarted: ({ sessionId }) =>
      setOptimisticSession({ id: sessionId, status: "ACTIVE", checkIn: new Date() }),
    onEnded: () =>
      setOptimisticSession((prev) => prev ? { ...prev, status: "COMPLETED" } : prev),
  });

  const isBusy = isStarting || isEnding;
  const isActiveSession = optimisticSession?.status === "ACTIVE";

  // Slides fixes : cours, salle, effectif, statut — +1 si action dispo
  const hasAction = canCheckIn || (isActiveSession && canCheckOut);
  const totalSlides = hasAction ? 5 : 4;

  // Clamp slide si action disparaît
  useEffect(() => {
    if (slide >= totalSlides) setSlide(totalSlides - 1);
  }, [totalSlides, slide]);

  const classLabel = schedule.group
    ? `${schedule.class.name} · ${schedule.group.name}`
    : schedule.class.name;

  // ── Slide 0 : Nom du cours + Horaire ─────────────────────────────────────
  const slideInfo = (
    <div className="flex flex-col items-center justify-center gap-3 h-full text-center">
      <div className="flex flex-col items-center gap-1">
        <p className="text-[13px] font-semibold leading-snug text-foreground line-clamp-2">
          {schedule.course.name}
        </p>
        <p className="text-[10px] text-muted-foreground">{classLabel}</p>
      </div>
      <div className="h-px w-8 rounded-full bg-border" />
      <div className="flex flex-col items-center gap-0.5">
        <Clock className="size-3.5 text-muted-foreground" />
        <span className="text-[13px] font-semibold tabular-nums text-foreground tracking-tight">
          {fmtTime(startAt)} – {fmtTime(endAt)}
        </span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
          Horaire
        </span>
      </div>
    </div>
  );

  // ── Slide 1 : Salle ───────────────────────────────────────────────────────
  const slideSalle = (
    <div className="flex flex-col items-center justify-center gap-2 h-full text-center">
      <MapPin className="size-4 text-muted-foreground" />
      <p className="text-[18px] font-semibold text-foreground leading-none">
        {schedule.room.name}
      </p>
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
        Salle
      </span>
    </div>
  );

  // ── Slide 2 : Effectif ────────────────────────────────────────────────────
  const studentCount =
    schedule.group?._count.studentGroups ??
    schedule.class._count.studentEnrollments ??
    0;

  const slideEffectif = (
    <div className="flex flex-col items-center justify-center gap-2 h-full text-center">
      <Users className="size-4 text-muted-foreground" />
      <p className="text-[28px] font-semibold text-foreground leading-none tabular-nums">
        {studentCount}
      </p>
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
        Étudiant{studentCount > 1 ? "s" : ""}
      </span>
    </div>
  );

  // ── Slide 1 : Statut + progression ───────────────────────────────────────
  const slideStatus = (
    <div className="flex flex-col items-center justify-center gap-2 h-full">
      <div className="relative flex items-center justify-center">
        <ProgressArc percent={countdown.progressPercent} />
        <span className="absolute text-[10px] font-semibold tabular-nums text-foreground">
          {isActiveSession && countdown.timeUntilEnd > 0
            ? fmtDuration(countdown.timeUntilEnd)
            : fmtDuration(countdown.timeUntilStart > 0 ? countdown.timeUntilStart : 0)}
        </span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", STATUS_DOT[uiStatus])} />
          <span className="text-[10px] font-medium text-foreground">
            {STATUS_LABEL[uiStatus]}
          </span>
        </div>
        {isLate && (
          <div className="flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400">
            <AlertCircle className="size-2.5" />
            <span>Retard détecté</span>
          </div>
        )}
      </div>
    </div>
  );

  // ── Slide 2 : Action ──────────────────────────────────────────────────────
  const ActionIcon = canCheckIn ? LogIn : isActiveSession && canCheckOut ? LogOut : Radio;
  const actionLabel = canCheckIn
    ? isLate ? "Démarrer (retard)" : "Démarrer"
    : isActiveSession && canCheckOut
    ? isLate ? "Clôturer (retard)" : "Clôturer"
    : "En cours";

  const slideAction = (
    <div className="flex flex-col items-center justify-center gap-3 h-full">
      <div className="flex flex-col items-center gap-1 text-center">
        <ActionIcon className="size-5 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground leading-tight">
          {canCheckIn ? "Prêt à démarrer la session" : "Prêt à clôturer la session"}
        </p>
      </div>
      <button
        type="button"
        disabled={isBusy}
        onClick={() => {
          if (canCheckIn) startSession();
          else if (isActiveSession && canCheckOut) endSession();
        }}
        className={cn(
          "w-full h-7 rounded-lg text-[11px] font-medium transition-all",
          "flex items-center justify-center gap-1.5",
          "bg-foreground text-background hover:opacity-90 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
        )}
      >
        {isBusy ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <>
            <ActionIcon className="size-3" />
            {actionLabel}
          </>
        )}
      </button>
    </div>
  );

  const slides = [slideInfo, slideSalle, slideEffectif, slideStatus, ...(hasAction ? [slideAction] : [])];

  return (
    <div className="flex flex-col h-full">
      {/* Contenu slide */}
      <div className="flex-1 overflow-hidden px-3.5 pt-3.5">
        {slides[slide]}
      </div>

      {/* Footer */}
      <div className="px-3.5 pb-3 pt-2">
        <SlideDots total={totalSlides} current={slide} onChange={setSlide} />
      </div>
    </div>
  );
}

// ─── Widget principal ─────────────────────────────────────────────────────────

export function NextSessionWidget({ teacherId, className }: NextSessionWidgetProps) {
  const { schedule, isLoading } = useNextSchedule({ teacherId });

  return (
    <div
      className={cn(
        "size-52 rounded-2xl border border-border bg-card shadow-sm overflow-hidden",
        "flex flex-col",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2 border-b border-border/60">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
          Prochain cours
        </span>
        {schedule && (
          <div className="flex items-center gap-1">
            <span className={cn("size-1.5 rounded-full", STATUS_DOT[
              // On a besoin du uiStatus ici — on le recalcule pas, on affiche juste le dot via schedule.session
              schedule.session?.status === "ACTIVE" ? "ongoing"
              : schedule.session?.status === "COMPLETED" ? "done"
              : "upcoming"
            ])} />
          </div>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : !schedule ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <CalendarOff className="size-5 opacity-40" />
          <span className="text-[10px]">Aucun cours à venir</span>
        </div>
      ) : (
        <WidgetInner teacherId={teacherId} schedule={schedule} />
      )}
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  LogIn,
  LogOut,
  Radio,
} from "lucide-react";
import { differenceInMinutes } from "date-fns";

import { Button } from "@/components/ui/button";
import { Gauge } from "@/components/ui/gauge";

import { useStartSession } from "@/hooks/data/sessions/use-start-session";
import { useNextSchedule } from "@/hooks/data/sessions/useNextSchedule";
import {
  useSessionState,
  type DBSession,
} from "@/hooks/data/sessions/use-session-state";
import type { SessionCountdownState } from "@/hooks/pratical/use-session-countdown";
import type { UISessionStatus } from "@/services/session/policy";
import type { TeacherNextSchedule } from "@/services/schedule";

import { SessionCarousel } from "./SessionCarousel";
import { CollapseSection } from "@/components/layout/CollapseSection";
import { SessionStatusBadge } from "./ui/SessionStatusBadge";

type TeacherSchedule = NonNullable<TeacherNextSchedule>;
type SessionPrimaryAction = "start" | "end" | null;

interface SessionActionButtonModel {
  label: string;
  disabled: boolean;
  Icon: LucideIcon;
  action: SessionPrimaryAction;
  variant: "default" | "secondary" | "outline";
}

function getAudience(schedule: TeacherSchedule): number {
  return (
    schedule.group?._count.studentGroups ??
    schedule.class._count.studentEnrollments ??
    0
  );
}

function sessionSubtitle(
  uiStatus: UISessionStatus,
  countdown: SessionCountdownState,
  isLate: boolean
): string {
  switch (uiStatus) {
    case "upcoming":
      return `Ouverture du pointage dans ${countdown.checkTime}.`;
    case "can-check-in":
      if (isLate) return "Démarrage possible (retard).";
      if (countdown.timeUntilStart > 0) return `Début dans ${countdown.checkTime}.`;
      return "Vous pouvez démarrer.";
    case "ongoing":
      return `Fin dans ${fmtDuration(countdown.timeUntilEnd)}.`;
    case "can-check-out":
      return isLate ? "Clôture possible (retard)." : "Vous pouvez clôturer.";
    case "done":
      return "Session terminée.";
    case "missed":
      return "Session manquée.";
    default:
      return "";
  }
}

function getSessionActionButton({
  uiStatus,
  canCheckIn,
  canCheckOut,
  isLate,
  isBusy,
  isActiveSession,
}: {
  uiStatus: UISessionStatus;
  canCheckIn: boolean;
  canCheckOut: boolean;
  isLate: boolean;
  isBusy: boolean;
  isActiveSession: boolean;
}): SessionActionButtonModel {
  if (uiStatus === "done") {
    return { label: "Session terminée", disabled: true, Icon: CheckCircle2, action: null, variant: "secondary" };
  }
  if (uiStatus === "missed") {
    return { label: "Créneau manqué", disabled: true, Icon: AlertCircle, action: null, variant: "secondary" };
  }
  if (canCheckIn) {
    return { label: isLate ? "Démarrer (retard)" : "Démarrer", disabled: isBusy, Icon: LogIn, action: "start", variant: "default" };
  }
  if (isActiveSession && canCheckOut) {
    return { label: isLate ? "Clôturer (retard)" : "Clôturer", disabled: isBusy, Icon: LogOut, action: "end", variant: "default" };
  }
  if (isActiveSession) {
    return { label: "Session en cours", disabled: true, Icon: Radio, action: null, variant: "secondary" };
  }
  return { label: "Indisponible", disabled: true, Icon: LogIn, action: null, variant: "outline" };
}

function fmtDuration(minutes: number) {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function SessionPageInner({
  schedule,
  teacherId,
}: {
  schedule: TeacherSchedule;
  teacherId: string;
}) {
  const startAt = useMemo(() => new Date(schedule.startTime), [schedule.startTime]);
  const endAt = useMemo(() => new Date(schedule.endTime), [schedule.endTime]);

  const [optimisticSession, setOptimisticSession] = useState<DBSession>(schedule.session);

  useEffect(() => {
    setOptimisticSession(schedule.session);
  }, [schedule.id, schedule.session?.id, schedule.session?.status, schedule.session?.checkIn]);

  const { uiStatus, canCheckIn, canCheckOut, isLate, countdown } = useSessionState({
    startTime: startAt,
    endTime: endAt,
    session: optimisticSession,
  });

  const { startSession, endSession, isStarting, isEnding } = useStartSession({
    scheduleId: schedule.id,
    teacherId,
    onStarted: ({ sessionId }) => {
      setOptimisticSession({ id: sessionId, status: "ACTIVE", checkIn: new Date() });
    },
    onEnded: () => {
      setOptimisticSession((prev) => (prev ? { ...prev, status: "COMPLETED" } : prev));
    },
  });

  const isBusy = isStarting || isEnding;
  const audience = getAudience(schedule);
  const subtitle = sessionSubtitle(uiStatus, countdown, isLate);
  const hasMissedStartWindow = uiStatus === "ongoing" && optimisticSession === null;
  const isActiveSession = optimisticSession?.status === "ACTIVE";
  const activeSession =
    isActiveSession && optimisticSession
      ? { id: optimisticSession.id, status: optimisticSession.status }
      : null;

  const totalMin = useMemo(() => Math.max(differenceInMinutes(endAt, startAt), 1), [endAt, startAt]);
  const scheduleDuration = fmtDuration(totalMin);
  const gaugeLabel =
    isActiveSession && countdown.timeUntilEnd > 0
      ? fmtDuration(countdown.timeUntilEnd)
      : scheduleDuration;

  const actionBtn = getSessionActionButton({ uiStatus, canCheckIn, canCheckOut, isLate, isBusy, isActiveSession });
  const ActionIcon = actionBtn.Icon;

  return (
    <div className="min-h-dvh bg-background">
      <header className="space-y-2 text-center pt-8 pb-2 px-5">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {schedule.course.ueCourse.code ?? "Session en cours"}
        </p>
        <h1 className="text-xl font-semibold leading-tight">{schedule.course.name}</h1>
        <div className="flex items-center justify-center gap-2">
          <SessionStatusBadge status={uiStatus} />
        </div>
        <p className="text-[12px] text-muted-foreground">{subtitle}</p>
      </header>

      <div className="mx-auto max-w-lg flex flex-col gap-5 px-5 pb-14 pt-6">
        <div className="flex justify-center">
          <Gauge
            value={Math.round(countdown.progressPercent)}
            size={180}
            strokeWidth={9}
            showPercentage
            unit="%"
            gradient
            label={gaugeLabel}
            primary="info"
          />
        </div>

        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <CollapseSection label="Détails de la séance" defaultOpen className="mt-0">
            <SessionCarousel
              schedule={{ ...schedule, startTime: startAt, endTime: endAt, session: activeSession }}
              studentCount={audience}
            />
          </CollapseSection>
        </div>

        {isLate && (canCheckIn || canCheckOut) && (
          <div className="flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[12px]">
            <AlertCircle className="size-4 shrink-0 text-amber-500 mt-px" />
            <span className="text-amber-700 dark:text-amber-300">Retard détecté sur cette session.</span>
          </div>
        )}

        {hasMissedStartWindow && (
          <div className="flex gap-2 rounded-lg border bg-muted px-3 py-2.5 text-[12px] text-muted-foreground">
            <AlertCircle className="size-4 shrink-0 mt-px" />
            <span>Fenêtre de démarrage dépassée.</span>
          </div>
        )}

        <Button
          size="lg"
          variant={actionBtn.variant}
          className="h-12 w-full rounded-xl"
          disabled={actionBtn.disabled}
          onClick={() => {
            if (actionBtn.action === "start") startSession();
            if (actionBtn.action === "end") endSession();
          }}
        >
          {isBusy ? (
            <span className="text-[13px]">Chargement…</span>
          ) : (
            <>
              <ActionIcon className="size-4 mr-2" />
              <span className="text-[13px] font-medium">{actionBtn.label}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function TeacherSessionPage({ teacherId }: { teacherId: string }) {
  const { schedule, isLoading } = useNextSchedule({ teacherId });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <CircleDashed className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 text-muted-foreground">
        <CircleDashed className="size-8" />
        <span className="text-sm">Aucun cours à venir</span>
      </div>
    );
  }

  return <SessionPageInner schedule={schedule} teacherId={teacherId} />;
}

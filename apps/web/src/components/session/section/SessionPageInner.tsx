"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, LogIn, LogOut, Radio,} from "lucide-react";
import { differenceInMinutes } from "date-fns";

import { Button } from "@/components/ui/button";
import { useStartSession } from "@/hooks/data/sessions/use-start-session";

import {
  useSessionState,
  type DBSession,
} from "@/hooks/data/sessions/use-session-state";
import type { UISessionStatus } from "@/services/session/policy";
import type { TeacherNextSchedule } from "@/services/schedule";
import { SessionCarousel } from "../SessionCarousel";



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
    return { label: "Démarrer", disabled: isBusy, Icon: isLate ? AlertCircle : LogIn, action: "start", variant: "default" };
  }
  if (isActiveSession && canCheckOut) {
    return { label: "Clôturer", disabled: isBusy, Icon: isLate ? AlertCircle : LogOut, action: "end", variant: "default" };
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

export default function SessionPageInner({
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
      <header className="text-center pt-8 pb-2 px-5">
        <h1 className="text-xl font-semibold leading-tight">{schedule.course.name}</h1>
      </header>

      <div className="mx-auto flex min-h-[calc(100dvh-11rem)] max-w-lg flex-col justify-center gap-15 px-5 mb-8 mt-6">
        <div className="">
          <SessionCarousel
            schedule={{ ...schedule, startTime: startAt, endTime: endAt, session: activeSession }}
            studentCount={audience}
            progressPercent={countdown.progressPercent}
            gaugeLabel={gaugeLabel}
          />
        </div>

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
              <ActionIcon className="size-4 mr-1" />
              <span className="text-[13px] font-medium">{actionBtn.label}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

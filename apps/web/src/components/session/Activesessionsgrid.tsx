"use client";

import { MapPin, Clock, User, CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useSessionCountdown } from "@/hooks/pratical/use-session-countdown";
import { useActiveSessions } from "@/hooks/data/sessions/use-active-sessions";
import { useReference } from "@/hooks/utils/use-reference";
import UserIcon from "@/components/users/UserIcon";
import { ActiveSessionItem } from "@/services/session";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveSessionCardProps {
  session: ActiveSessionItem;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(date: Date) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(minutes: number) {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;

  return h > 0
    ? `${h}h ${m < 10 ? `0${m}` : m}`
    : `${m}m`;
}

function teacherName(
  teacher: ActiveSessionItem["schedule"]["teacher"] | null | undefined,
): string {
  if (!teacher) return "—";

  const { firstName, lastName } = teacher.user;

  return [firstName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "—";
}

// ─── Card individuelle ────────────────────────────────────────────────────────

function ActiveSessionCard({ session }: ActiveSessionCardProps) {
  const { schedule } = session;

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

  const { timeUntilEnd, progressPercent } = useSessionCountdown({
    startTime: startAt,
    endTime: endAt,
  });

  const isAlmostDone = timeUntilEnd <= 15 && timeUntilEnd > 0;
  const teacher = schedule.teacher;

  return (
<Card
  className={cn(
    "h-42 w-42 shrink-0",
    "flex flex-col justify-between",
    "p-3.5 overflow-hidden relative gap-1",

    // Hover effects
    "transition-all duration-300 ease-out",
    // "hover:-translate-y-1",
    "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
    "hover:border-primary/30",
    "hover:bg-accent/30",

    // Interaction
    "cursor-pointer",
    "group",
  )}
>
      
      {/* Barre hachurée — progression */}
      <div className="relative h-9 rounded-lg overflow-hidden border border-border/60 transition-all duration-1000">
        
        {/* fond hachuré */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(128,128,128,0.08) 5px, rgba(128,128,128,0.08) 10px)",
          }}
        />

        {/* progression */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-all duration-1000",
            isAlmostDone
              ? "bg-amber-500/20"
              : "bg-emerald-500/15",
          )}
          style={{ width: `${progressPercent}%` }}
        />

        {/* temps restant */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "text-[11px] font-semibold tabular-nums",
              isAlmostDone
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground",
            )}
          >
            {timeUntilEnd > 0
              ? fmtDuration(timeUntilEnd)
              : "Terminée"}
          </span>
        </div>
      </div>

      {/* Avatar + enseignant */}
      <div className="flex flex-col items-center justify-center gap-1.5">
        <UserIcon
          avatarUrl={teacher?.user?.avatar_url}
          className="size-14 p-1"
        />

        <div className="flex items-center gap-1.5 min-w-0 max-w-full">
          <User className="size-3 shrink-0 text-muted-foreground" />

          <p className="text-[12px] font-semibold text-foreground truncate">
            {teacherName(teacher)}
          </p>
        </div>
      </div>

      {/* Horaire + salle */}
      <div className="flex flex-col items-center gap-1">
        
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="size-3 shrink-0" />

          <span className="tabular-nums font-mono">
            {fmtTime(startAt)} – {fmtTime(endAt)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <MapPin className="size-3 shrink-0" />

          <span className="truncate font-medium">
            {schedule.room.name}
          </span>
        </div>
      </div>
    </Card>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SessionCardSkeleton() {
  return (
    <Card className="size-42 shrink-0 flex flex-col justify-between p-3.5 gap-1 animate-pulse">
      
      <div className="h-9 w-full rounded-lg bg-muted" />

      <div className="flex flex-col items-center gap-2">
        <div className="size-14 rounded-full bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <div className="h-2.5 w-1/2 rounded bg-muted" />
        <div className="h-2.5 w-1/3 rounded bg-muted" />
      </div>
    </Card>
  );
}

// ─── Container principal ──────────────────────────────────────────────────────

export function ActiveSessionsGrid({
  className,
}: {
  className?: string;
}) {
  const { sessions, isLoading } = useActiveSessions();

  if (!isLoading && sessions.length === 0) {
    return (
      <Card
        className={cn(
          "flex min-h-[180px] border-0 items-center justify-center",
          className,
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <CalendarX className="size-5 text-muted-foreground/40" />
          <span className="text-[11px] text-muted-foreground">
            Aucune session en cours
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card
      style={{ gridTemplateColumns: "repeat(auto-fill, 168px)" }}
      className={cn(
        "grid w-full gap-1",
        "max-h-[460px] border-0 overflow-y-auto scrollbar-hidden",
        "p-1",
        className,
      )}
    >
      {isLoading
        ? Array.from({ length: 9 }).map((_, i) => (
            <SessionCardSkeleton key={i} />
          ))
        : sessions.map((session) => (
            <ActiveSessionCard
              key={session.id}
              session={session}
            />
          ))}
    </Card>
  );
}
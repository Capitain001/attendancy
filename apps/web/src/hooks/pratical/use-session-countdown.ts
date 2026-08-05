// src/hooks/pratical/use-session-countdown.ts
"use client"

import { useState, useEffect, useMemo, useCallback } from "react";
import { differenceInMinutes, isBefore } from "date-fns";
import { sessionConfig } from "@/config";

interface UseSessionCountdownProps {
  startTime: Date;
  endTime: Date;
  checkInThresholdMinutes?: number;
  checkOutThresholdMinutes?: number;
}

export type TimePhase =
  | "before"    // avant start-15
  | "checkin"   // [start-15 → start+15]
  | "ongoing"   // (start+15 → end]
  | "checkout"  // (end → end+15]
  | "after";    // après end+15

export interface SessionCountdownState {
  phase: TimePhase;
  checkTime: string;
  canCheckIn: boolean;
  canCheckOut: boolean;
  isLateCheckIn: boolean;
  timeUntilStart: number;
  timeUntilEnd: number;
  progressPercent: number;
}

/**
 * Gère le cycle de vie temporel d'une session.
 * Données purement temporelles — aucun état DB.
 *
 * Fenêtres :
 *   check-in  : [start - threshold  →  start + threshold]
 *   check-out : (end               →  end   + threshold]
 */
export function useSessionCountdown({
  startTime,
  endTime,
  checkInThresholdMinutes  = sessionConfig.thresholds.checkIn,
  checkOutThresholdMinutes = sessionConfig.thresholds.checkOut,
}: UseSessionCountdownProps): SessionCountdownState {

  const [now, setNow] = useState(new Date());

  const updateNow = useCallback(() => setNow(new Date()), []);

  useEffect(() => {
    const interval = setInterval(updateNow, sessionConfig.timer.updateInterval);
    return () => clearInterval(interval);
  }, [updateNow]);

  return useMemo(() => {

    const minutesUntilStart = differenceInMinutes(startTime, now);
    const minutesUntilEnd   = differenceInMinutes(endTime, now);

    const checkInStart = new Date(startTime.getTime() - checkInThresholdMinutes  * 60_000);
    const checkInEnd   = new Date(startTime.getTime() + checkInThresholdMinutes  * 60_000);
    const checkOutEnd  = new Date(endTime.getTime()   + checkOutThresholdMinutes * 60_000);

    const canCheckIn    = now >= checkInStart && now < checkInEnd;
    const canCheckOut   = now >  endTime      && now < checkOutEnd;
    const isLateCheckIn = canCheckIn && now > startTime;

    const phase: TimePhase = (() => {
      if (isBefore(now, checkInStart)) return "before";
      if (canCheckIn)                  return "checkin";
      if (isBefore(now, endTime))      return "ongoing";
      if (canCheckOut)                 return "checkout";
      return "after";
    })();

    const fmt = (mins: number) => {
      const abs = Math.abs(mins);
      const h   = Math.floor(abs / 60);
      const m   = abs % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const checkTime = phase === "before" || phase === "checkin"
      ? fmt(minutesUntilStart)
      : fmt(minutesUntilEnd);

    const totalDuration  = differenceInMinutes(endTime, startTime);
    const elapsed        = totalDuration - minutesUntilEnd;
    const progressPercent = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

    return {
      phase,
      checkTime,
      canCheckIn,
      canCheckOut,
      isLateCheckIn,
      timeUntilStart: minutesUntilStart,
      timeUntilEnd:   minutesUntilEnd,
      progressPercent,
    };

  }, [now, startTime, endTime, checkInThresholdMinutes, checkOutThresholdMinutes]);
}
/* 
exemple 

const { status, canCheckIn, checkTime, progressPercent } = useSessionCountdown({
  startTime: new Date(schedule.startTime),
  endTime: new Date(schedule.endTime)
});

// Dans ton bouton de check-in :
<Button disabled={!canCheckIn}>
  {canCheckIn ? "demarrer" : `Début dans ${checkTime}`}
</Button>
*/
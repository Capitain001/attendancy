// src/hooks/practical/use-session-state.ts
"use client"

import {
  useSessionCountdown,
  type SessionCountdownState,
} from "@/hooks/pratical/use-session-countdown";

import {
  deriveSessionPresence,
  deriveUISessionStatus,
  type DBSession,
  type UISessionStatus,
  type SessionPolicy,
} from "@/services/session/policy";


export type { DBSession, UISessionStatus };

export interface CombinedSessionState extends SessionPolicy {
  countdown: SessionCountdownState;
}

interface UseSessionStateProps {
  startTime: Date;
  endTime: Date;
  session: DBSession;
}

/**
 * Adaptateur UI — combine le temps (countdown) et la logique métier (policy).
 * Ne décide rien : délègue à useSessionCountdown + session-policy.
 */
export function useSessionState({
  startTime,
  endTime,
  session,
}: UseSessionStateProps): CombinedSessionState {

  const countdown = useSessionCountdown({ startTime, endTime });

  const presence = deriveSessionPresence(session);

  const policy = deriveUISessionStatus(
    countdown.phase,
    presence,
    countdown.isLateCheckIn,
  );

  return {
    ...policy,
    countdown,
  };
}

/* const countdown: SessionCountdownState */
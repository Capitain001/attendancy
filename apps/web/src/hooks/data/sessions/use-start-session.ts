// src/hooks/data/sessions/use-start-session.ts
"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionConfig } from "@/config";
import { CACHE_KEYS } from "@/config/client_cache";
import { toast } from "sonner";
import { startSessionAction, completeSessionAction } from "@/services/session/actions";

// ─── GPS helper ───────────────────────────────────────────────────────────────

async function tryGetCoords(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => resolve(null),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface StartedPayload {
  sessionId:     string;
  checkInMethod: string;
}

interface UseStartSessionOptions {
  scheduleId: string;
  teacherId:  string;
  onStarted?: (payload: StartedPayload) => void;
  onEnded?:   (durationMinutes: number) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStartSession({
  scheduleId,
  teacherId,
  onStarted,
  onEnded,
}: UseStartSessionOptions) {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const invalidateScheduleQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: sessionConfig.queryKeys.todaySchedules(teacherId) });
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SCHEDULES.NEXT(teacherId) });
    queryClient.invalidateQueries({ queryKey: ["today-courses", teacherId] });
  }, [queryClient, teacherId]);

  const startMutation = useMutation({
    mutationFn: async () => {
      const coords = await tryGetCoords();
      return startSessionAction(scheduleId, coords);
    },
    onSuccess: (result) => {
      const { data, error } = result;
      if (error) { toast.error(error); return; }
      if (data) {
        setSessionId(data.sessionId);
        toast.success(sessionConfig.messages.startSuccess);
        onStarted?.({ sessionId: data.sessionId, checkInMethod: data.checkInMethod });
      }
      invalidateScheduleQueries();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : sessionConfig.messages.startError);
    },
  });

  const endMutation = useMutation({
    // clôture complète (R4) : fin de session + absences + notifs
    mutationFn: () => completeSessionAction(scheduleId),
    onSuccess: (result) => {
      const { data, error } = result;
      if (error) { toast.error(error); return; }
      if (data) {
        onEnded?.(data.durationMinutes);
        toast.success(`Session terminée — ${data.durationMinutes} min effectuées.`);
      }
      invalidateScheduleQueries();
    },
    onError: () => toast.error("Erreur lors de la clôture de la session."),
  });

  const startSession = useCallback(() => startMutation.mutate(), [startMutation]);
  const endSession   = useCallback(() => endMutation.mutate(),   [endMutation]);

  return {
    sessionId,
    startSession,
    endSession,
    isStarting: startMutation.isPending,
    isEnding:   endMutation.isPending,
    hasStarted: !!sessionId,
  };
}

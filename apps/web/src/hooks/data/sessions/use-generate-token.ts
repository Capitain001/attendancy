// src/hooks/data/sessions/use-generate-token.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateTokenAction } from "@/services/session/token.actions";

const TOKEN_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface TokenState {
  token:     string;
  url:       string;
  expiresAt: Date;
}

interface UseGenerateTokenOptions {
  sessionId: string;
  /** Auto-refresh le token 30s avant expiry */
  autoRefresh?: boolean;
}

export function useGenerateToken({
  sessionId,
  autoRefresh = true,
}: UseGenerateTokenOptions) {
  const [tokenState, setTokenState] = useState<TokenState | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // ── Génération ────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: () => generateTokenAction(sessionId),
    onSuccess: (result) => {
      if ('error' in result) { toast.error(result.error); return; }
      setTokenState({
        token:     result.data.token,
        url:       result.data.url,
        expiresAt: new Date(result.data.expiresAt),
      });
    },
    onError: () => toast.error("Erreur lors de la génération du QR code."),
  });

  const generate = useCallback(() => mutation.mutate(), [mutation]);

  // ── Countdown + auto-refresh ──────────────────────────────────────────────

  useEffect(() => {
    if (!tokenState) return;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((tokenState.expiresAt.getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);

      // Auto-refresh 30s avant expiry
      if (autoRefresh && remaining === 30) {
        generate();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tokenState, autoRefresh, generate]);

  const progressPercent = tokenState
    ? Math.max(0, (secondsLeft / (TOKEN_DURATION_MS / 1000)) * 100)
    : 0;

  const isExpired  = secondsLeft === 0 && !!tokenState;
  const isGenerating = mutation.isPending;

  return {
    tokenState,
    secondsLeft,
    progressPercent,
    isExpired,
    isGenerating,
    generate,
  };
}

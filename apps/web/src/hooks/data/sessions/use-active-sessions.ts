// src/hooks/data/sessions/use-active-sessions.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { CACHE_KEYS } from '@/config/client_cache';
import { getActiveSessionsAction } from "@/services/session/actions";


export function useActiveSessions() {
  const { data: response, isLoading, error } = useQuery({
    queryKey: CACHE_KEYS.SESSIONS.ACTIVE,
    queryFn: () => getActiveSessionsAction(),
    staleTime: 30_000,
  });

  const sessions = response?.data ?? [];

  return { sessions, isLoading, error };
}
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { InvitationListItem, InvitationStats } from "@/services/invite";
import { orgInvitationsQuery } from "@/services/invite/queries";
import { calculateInvitationStats } from "@/services/invite";

interface UseInvitationsOptions {
  limit?: number;
  enabled?: boolean;
}

export function useInvitations({ limit = 50, enabled = true }: UseInvitationsOptions = {}) {
  const { data: invitations = [], isLoading, error, refetch } = useQuery<InvitationListItem[]>({
    ...orgInvitationsQuery({ limit }),
    enabled,
  });

  return { invitations, isLoading, error, refetch };
}

export function useInvitationStats({ limit = 50 }: { limit?: number } = {}) {
  const { data, isLoading, error, refetch } = useQuery<InvitationListItem[]>({
    ...orgInvitationsQuery({ limit }),
  });

  const stats: InvitationStats = useMemo(() => {
    if (!data) return { total: 0, pending: 0, expired: 0, accepted: 0 };
    return calculateInvitationStats(data);
  }, [data]);

  return { stats, isLoading, error, refetch };
}
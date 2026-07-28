// src/hooks/users/useUserStats.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserRoleStatsAction } from "@/services/user/actions";
import type { UserRoleStats } from "@/services/users/stats";

export function useUserStats() {
  const query = useQuery<UserRoleStats, Error>({
    queryKey: ["user-role-stats"],
    queryFn: async () => {
      const result = await getUserRoleStatsAction();
      if ('error' in result) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    ...query,
    loading: query.isLoading || query.isPending,
  };
}


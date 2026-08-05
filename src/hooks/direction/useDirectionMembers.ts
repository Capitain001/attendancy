// src/hooks/direction/useDirectionMembers.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getDirectionMembersAction } from "@/services/direction/actions";
import type { GetDirectionMembersDto } from "@/services/direction";


interface UseDirectionMembersOptions {
  orgId: string;
  includeDeleted?: boolean;
  functionId?: string;
  enabled?: boolean;
  initialData?: GetDirectionMembersDto;
}

/**
 * Hook pour récupérer les membres de la direction d'une organisation
 * 
 * @param options - Options du hook
 * @returns Données et états des membres de la direction
 */
export function useDirectionMembers({
  orgId,
  includeDeleted = false,
  functionId,
  enabled = true,
  initialData,
}: UseDirectionMembersOptions) {
  const queryKey = ["directions", orgId, includeDeleted, functionId];

  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useQuery<GetDirectionMembersDto>({
    queryKey,
    queryFn: async () => {
      const result = await getDirectionMembersAction({ functionId });
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: enabled && !!orgId,
    initialData: initialData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: !initialData,
    refetchOnWindowFocus: false,
  });

  return {
    members,
    isLoading,
    error,
    refetch,
  };
}


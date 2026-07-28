// src/hooks/data/userFunctions/useProfileFunctions.ts
"use client";

import { useCallback } from "react";
import { useEntity } from "@/hooks/entity/useEntity";
import { getFunctionProfilesAction } from "@/services/users/profile/actions";
import type { FunctionProfile, UserProfile } from "@/services/users/profile/types";

/**
 * Hook pour récupérer les profils des utilisateurs selon l'ID de fonction
 *
 * @example
 * ```tsx
 * // Charger les profils des utilisateurs ayant une fonction spécifique
 * const { data, loading, error, refetch } = useProfileFunctions({ 
 *   functionId: "function-123" 
 * });
 *
 * // Avec options personnalisées
 * const profiles = useProfileFunctions({ 
 *   functionId: "function-123",
 *   staleTime: 10 * 60 * 1000, // 10 minutes
 *   enabled: !!functionId
 * });
 * ```
 */
export function useProfileFunctions({
  functionId,
  staleTime,
  enabled = true,
}: {
  functionId: string;
  staleTime?: number;
  enabled?: boolean;
}) {
  const fetchFn = useCallback(async () => {
    if (!functionId) {
      throw new Error("functionId est requis");
    }

    const response = await getFunctionProfilesAction(functionId);

    if ('error' in response) {
      throw new Error(response.error);
    }
    return response.data;
  }, [functionId]);

  const entityName = `function-profiles-${functionId}`;

  const entity = useEntity<FunctionProfile>({
    entityName,
    fetchFn,
    enabled: enabled && !!functionId,
    staleTime,
    
    revalidateMode: "invalidate",
  });

  return {
    ...entity,
  };
}


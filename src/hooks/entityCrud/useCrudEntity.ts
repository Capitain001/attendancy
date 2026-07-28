"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type Payload<T> =
  | { type: "INSERT"; record: T; old_record?: null }
  | { type: "UPDATE"; record: T; old_record: T }
  | { type: "DELETE"; record?: null; old_record: T };

export interface UseCrudEntityOptions<T> {
  entityName: string ;
  fetchFn: () => Promise<T[]>;
  staleTime?: number;
  revalidateMode?: "patch" | "invalidate"; // patch direct ou re-fetch
}

export function useCrudEntity<T extends { id: string }>(
  options: UseCrudEntityOptions<T>
) {
  const {
    entityName,
    fetchFn,
    staleTime = 1000 * 60 * 5,
    revalidateMode = "patch",
  } = options;

  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error, refetch } = useQuery<T[]>({
    queryKey: [entityName],
    queryFn: fetchFn,
    staleTime,
  });

  /**
   * Appliquer un payload Supabase pour mettre à jour le cache
   */
  const applyPayload = (payload: Payload<T>) => {
    if (revalidateMode === "invalidate") {
        queryClient.invalidateQueries({
            queryKey: [entityName],
          });
          
      return;
    }

    queryClient.setQueryData<T[]>([entityName], (old) => {
      if (!old) return old;

      switch (payload.type) {
        case "INSERT":
          return [...old, payload.record];

        case "UPDATE":
          return old.map((item) =>
            item.id === payload.record.id ? payload.record : item
          );

        case "DELETE":
          return old.filter((item) => item.id !== payload.old_record.id);

        default:
          return old;
      }
    });
  };

  return {
    data: data || [],
    loading: isLoading,
    refreshing: isFetching,
    error,
    refetch,
    applyPayload,
    queryClient,
  };
}

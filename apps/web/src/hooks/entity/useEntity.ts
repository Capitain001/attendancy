//@/hooks/entity/useEntity.ts
//@ts-nocheck

"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EntityFetchFn, EntityParams } from "./types";

// Fonction de transformation par défaut réutilisable
export const itemsToById = <T extends { id: string }>(items: T[]) => ({
  items,
  byId: items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<string, T>)
});

export type Payload<T> =
  | { type: "INSERT"; record: T }
  | { type: "UPDATE"; record: T; old_record: T }
  | { type: "DELETE"; old_record: T };

export interface UseEntityOptions<T> {
  entityName: string;
  fetchFn?: EntityFetchFn<T>;
  transformFn?: (items: T[]) => any;
  suspense?: boolean;
  enabled?: boolean;
  initialParams?: EntityParams;
  staleTime?: number;
  revalidateMode?: "patch" | "invalidate";
}

// Types de retour
export interface BaseEntityResult<T> {
  data: { items: T[]; byId: Record<string, T> };
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<any>;
  refetchWithParams: (newParams: EntityParams) => Promise<T[]>;
  queryClient: any;
}

export interface EntityResultWithCRUD<T> extends BaseEntityResult<T> {
  applyPayload: (payload: Payload<T>) => void;
}

// 🔥 OVERLOADS - Déclaration des signatures
export function useEntity<T extends { id: string }>(
  options: UseEntityOptions<T> & { revalidateMode: "patch" | "invalidate" }
): EntityResultWithCRUD<T>;

export function useEntity<T extends { id: string }>(
  options: UseEntityOptions<T>
): BaseEntityResult<T>;

// 🔥 IMPLÉMENTATION
export function useEntity<T extends { id: string }>(
  options: UseEntityOptions<T>
) {
  const {
    entityName,
    fetchFn,
    transformFn,
    suspense = false,
    enabled = true,
    initialParams,
    staleTime = 1000 * 60 * 5,
    revalidateMode,
  } = options;

  const queryClient = useQueryClient();
  const queryKey = [entityName, initialParams].filter(Boolean);

  // Fetch conditionnel - seulement si fetchFn fourni
  const queryEnabled = !!fetchFn && enabled;

  const {
    data,
    isLoading,
    isFetching,
    error,
    isError,
    isSuccess,
    refetch,
  } = useQuery<T[], Error, any>({
    queryKey,
    queryFn: fetchFn ? () => fetchFn(initialParams) : (() => Promise.resolve([]) as Promise<T[]>),
    staleTime,
    refetchOnWindowFocus: false,
    enabled: queryEnabled,
    ...(suspense ? { suspense: true } : {}),

    select: transformFn || itemsToById,
  });

  /**
   * Refetch qui maintient la cohérence du cache
   */
  const refetchWithParams = async (newParams: EntityParams) => {
    if (!fetchFn) {
      throw new Error("fetchFn is required for refetchWithParams");
    }

    const newQueryKey = [entityName, newParams].filter(Boolean);
    const newData = await fetchFn(newParams);
    const transformedNewData = transformFn
      ? transformFn(newData)
      : itemsToById(newData);

    queryClient.setQueryData(newQueryKey, (oldData: any) => {
      if (!oldData) return transformedNewData;

      const mergedItems = mergeItemsById(oldData.items, newData);
      const mergedTransformed = transformFn
        ? transformFn(mergedItems)
        : itemsToById(mergedItems);

      return mergedTransformed;
    });

    return newData;
  };

  

  /**
   * Appliquer un payload pour mise à jour optimiste du cache
   */
  const applyPayload = (payload: Payload<T>) => {
    if (revalidateMode === "invalidate") {
      queryClient.invalidateQueries({ queryKey });
      return;
    }

    // Mode "patch" - mise à jour optimiste
    queryClient.setQueryData<any>(queryKey, (old: any) => {
      if (!old) return old;

      const currentItems = Array.isArray(old) ? old : old.items || [];
      const currentById = Array.isArray(old)
        ? old.reduce((acc, item) => ({ ...acc, [item.id]: item }), {} as Record<string, T>)
        : old.byId || {};

      let newItems: T[];
      let newById: Record<string, T>;

      switch (payload.type) {
        case "INSERT": {
          const exists = !!currentById[payload.record.id];
          newItems = exists
            ? currentItems.map((item) =>
              item.id === payload.record.id ? payload.record : item
            )
            : [...currentItems, payload.record];
          newById = { ...currentById, [payload.record.id]: payload.record };
          break;
        }

        case "UPDATE": {
          // merge superficiel : accepte un record partiel ({id, ...quelques champs})
          const merged = { ...currentById[payload.record.id], ...payload.record };
          newItems = currentItems.map((item) =>
            item.id === payload.record.id ? merged : item
          );
          newById = { ...currentById, [payload.record.id]: merged };
          break;
        }

        case "DELETE":
          newItems = currentItems.filter((item) => item.id !== payload.old_record.id);
          newById = { ...currentById };
          delete newById[payload.old_record.id];
          break;

        default:
          return old;
      }

      return Array.isArray(old) ? newItems : { ...old, items: newItems, byId: newById };
    });
  };

  const baseResult = {
    data: data || { items: [], byId: {} },
    loading: isLoading,
    refreshing: isFetching,
    error,
    isError,
    isSuccess,
    refetch,
    refetchWithParams,
    queryClient,
  };

  // Retourner avec applyPayload seulement si revalidateMode est spécifié
  if (revalidateMode) {
    return {
      ...baseResult,
      applyPayload,
    };
  }

  return baseResult;
}

// Helpers pour la manipulation des données et la fusion
function mergeItemsById<T extends { id: string }>(oldItems: T[], newItems: T[]): T[] {
  const result = [...oldItems];

  newItems.forEach(newItem => {
    const index = result.findIndex(item => item.id === newItem.id);
    if (index >= 0) {
      result[index] = newItem;
    } else {
      result.push(newItem);
    }
  });

  return result;
}

/**
 * Wrapper ultra-simple extraire les items des return complexes
 */
export const asEntityFetcher = <T extends { id: string }>(
  paginatedFetchFn: (params?: any) => Promise<{ items: T[] }>
): EntityFetchFn<T> => {
  return async (params) => {
    const response = await paginatedFetchFn(params);
    return response.items;
  };
};

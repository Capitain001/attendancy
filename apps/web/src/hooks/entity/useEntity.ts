// @/hooks/entity/useEntity.ts
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
  /**
   * Transforme les items bruts avant qu'ils n'atteignent le composant
   * (passé tel quel à `select` de react-query, voir plus bas).
   *
   * DOIT être une référence stable : une fonction inline recréée à
   * chaque render (`transformFn={() => ...}`) change de référence à
   * chaque passage, et react-query recalcule `select` à chaque render
   * au lieu de réutiliser le résultat mémoïsé — même si `data` n'a pas
   * changé. Définissez-la au niveau module, ou stabilisez-la avec
   * `useCallback` si elle dépend de props/state du composant appelant.
   */
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

// 🔥 IMPLÉMENTATION
// Signature unique : applyPayload est toujours retourné (garde-fou runtime
// ci-dessous s'il est appelé sans revalidateMode configuré), plutôt que
// deux overloads dont la sélection dépendait d'un littéral "patch" |
// "invalidate" écrit en dur — tout `revalidateMode` construit dynamiquement
// (ex: `crud ? "patch" : undefined`) faisait retomber TS sur le mauvais
// overload, ce qui obligeait chaque appelant à un cast/`!` manuel pour
// contourner un type qui ne reflétait plus la réalité à l'exécution.
export function useEntity<T extends { id: string }>(
  options: UseEntityOptions<T>
): EntityResultWithCRUD<T> {
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

    // `transformFn` doit être stable (voir JSDoc sur UseEntityOptions.transformFn) :
    // select recalcule à chaque render si la référence change, même sans nouvelle donnée.
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

    queryClient.setQueryData<T[]>(newQueryKey, (oldData: T[] | undefined) => {
      if (!oldData) return newData;
      return mergeItemsById(oldData, newData);
    });

    return newData;
  };


  /**
   * Appliquer un payload pour mise à jour optimiste du cache
   */
  const applyPayload = (payload: Payload<T>) => {
    // Garde-fou runtime : sans overload pour l'imposer à la compilation,
    // c'est ici que l'erreur d'usage (appeler applyPayload sur une entité
    // qui n'a pas configuré revalidateMode) doit être détectée — un throw
    // explicite plutôt qu'un no-op silencieux, pour que l'erreur remonte
    // au premier appel fautif plutôt que de se manifester en cache
    // incohérent plus tard.
    if (!revalidateMode) {
      throw new Error(
        `useEntity("${entityName}") : applyPayload() appelé sans revalidateMode ` +
        `("patch" | "invalidate") configuré sur ce hook. Passez revalidateMode ` +
        `à useEntity, ou n'appelez pas applyPayload pour cette entité.`
      );
    }

    if (revalidateMode === "invalidate") {
      queryClient.invalidateQueries({ queryKey });
      return;
    }

    // Mode "patch" - mise à jour optimiste
    queryClient.setQueryData<any>(queryKey, (old: any) => {
      if (!old) return old;

      // Annotations explicites : sans elles, `Array.isArray(old) ? old : old.items || []`
      // s'effondre en `any` pur (branche vraie `any[]`, branche fausse `any` → union = `any`),
      // ce qui prive .map/.filter de toute inférence contextuelle sur `item` (implicit any).
      // En typant la variable ici, T se propage normalement aux callbacks ci-dessous.
      const currentItems: T[] = Array.isArray(old) ? old : old.items || [];
      const currentById: Record<string, T> = Array.isArray(old)
        ? old.reduce((acc: Record<string, T>, item: T) => ({ ...acc, [item.id]: item }), {})
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

  return {
    data: data || { items: [], byId: {} },
    loading: isLoading,
    refreshing: isFetching,
    error,
    isError,
    isSuccess,
    refetch,
    refetchWithParams,
    queryClient,
    applyPayload,
  };
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
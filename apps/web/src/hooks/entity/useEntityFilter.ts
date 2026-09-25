// src/hooks/entity/useEntityFilter.ts
"use client";
import { useEntity, UseEntityOptions, Payload } from "./useEntity";
import { useMemo } from "react";
import {
  applyFilter,
  applySort,
  createByIdMap,
  useFilterFn,
  useSortFn,
} from "./entityFilters";
import { PartialDeep, Path, EntityParams } from "./types";
import { useDeepMemo } from "./cache";

/**
 * Options pour useEntityFilter avec syntaxe shorthand
 */
export interface UseEntityFilterOptions<T> extends UseEntityOptions<T> {
  where?: PartialDeep<T>;
  sort?: { key: Path<T>; order: "asc" | "desc" };
  page?: number;
  limit?: number;
}

/**
 * Résultat de useEntityFilter avec applyPayload toujours disponible
 */
export interface EntityFilterResult<T> {
  data: {
    items: T[];
    byId: Record<string, T>;
    allItems: T[];
    allById: Record<string, T>;
    total: number;
  };
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  refetchWithParams: (newParams: EntityParams) => Promise<T[]>;
  isFilteredView: boolean;
  applyPayload: (payload: Payload<T>) => void;
}

/**
 * Hook useEntityFilter optimisé avec stabilisation des options et applyPayload
 */
export const useEntityFilter = <T extends { id: string }>(
  options: UseEntityFilterOptions<T>
): EntityFilterResult<T> => {
  const { where, sort, page = 1, limit, ...entityOptions } = options;

  // Deep-memo ciblé : seuls where/sort sont susceptibles d'être recréés
  // avec un contenu identique à chaque render côté appelant.
  const stableWhere = useDeepMemo(where);
  const stableSort = useDeepMemo(sort);

  // revalidateMode par défaut à "patch" : utile en soi (sans lui, applyPayload
  // lèverait le garde-fou runtime de useEntity), pas un contournement de type —
  // useEntity retourne désormais toujours applyPayload quel que soit revalidateMode.
  const enhancedEntityOptions = {
    ...entityOptions,
    revalidateMode: entityOptions.revalidateMode || "patch"
  };

  // Utilise le hook principal pour récupérer les données de base
  const entityData = useEntity<T>(enhancedEntityOptions);

  // ✅ FILTRES OPTIMISÉS AVEC CACHE
  const filterFn = useFilterFn<T>(stableWhere);
  const sortFn = useSortFn<T>(stableSort);

  // ✅ EXTRACTION DES DONNÉES POUR DÉPENDANCES STABLES
  const { items, byId } = entityData.data;

  // ✅ MÉMOÏSATION OPTIMISÉE
  const viewData = useMemo(() => {
    // Si aucun filtre ni tri, renvoyer directement les données brutes
    const processedItems = where || sort
      ? applySort(applyFilter(items, filterFn), sortFn)
      : items;

    const processedById = where || sort
      ? createByIdMap(processedItems, byId) // ✅ Réutilisation du byId existant
      : byId;

    // Pagination
    const paginatedItems = limit
      ? processedItems.slice((page - 1) * limit, page * limit)
      : processedItems;

    return {
      items: paginatedItems,
      byId: processedById,
      allItems: items,
      allById: byId,
      total: processedItems.length,
      isFilteredView: !!(where || sort)
    };
  }, [items, byId, filterFn, sortFn, page, limit]); // ✅ Dépendances stabilisées

  // Retour avec applyPayload toujours disponible (type garanti par useEntity)
  return {
    data: {
      items: viewData.items,
      byId: viewData.byId,
      allItems: viewData.allItems,
      allById: viewData.allById,
      total: viewData.total,
    },
    loading: entityData.loading,
    refreshing: entityData.refreshing,
    error: entityData.error,
    refetch: entityData.refetch,
    refetchWithParams: entityData.refetchWithParams,
    isFilteredView: viewData.isFilteredView,
    applyPayload: entityData.applyPayload,
  };
};
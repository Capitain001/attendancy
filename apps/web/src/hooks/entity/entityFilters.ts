// src/hooks/entity/entityFilters.ts
import { useMemo } from "react";
import { PartialDeep } from "./types";
import { createValueGetter, FilterCache, useDeepMemo, isOperatorObject } from "./cache";

/**
 * Applique un filtre à un tableau d'items
 */
export const applyFilter = <T>(
  items: T[],
  filterFn?: (item: T) => boolean
): T[] => {
  if (!filterFn) return items;
  return items.filter(filterFn);
};

/**
 * Applique un tri à un tableau d'items
 */
export const applySort = <T>(
  items: T[],
  sortFn?: (a: T, b: T) => number
): T[] => {
  if (!sortFn) return items;
  return [...items].sort(sortFn);
};

/**
 * Crée un dictionnaire byId à partir d'un tableau d'items
 * Version optimisée avec meilleure vérification de réutilisation
 */
export const createByIdMap = <T extends { id: string }>(
  items: T[],
  existingById?: Record<string, T>
): Record<string, T> => {
  // Vérification robuste pour réutiliser l'existant
  if (existingById && canReuseByIdMap(items, existingById)) {
    return existingById;
  }

  // Reconstruction nécessaire
  return items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<string, T>);
};

// Helper pour déterminer si on peut réutiliser le byId existant
function canReuseByIdMap<T extends { id: string }>(
  items: T[],
  existingById: Record<string, T>
): boolean {
  if (Object.keys(existingById).length !== items.length) {
    return false;
  }

  // Vérification par échantillonnage (3 éléments)
  const sampleSize = Math.min(3, items.length);
  for (let i = 0; i < sampleSize; i++) {
    const item = items[i];
    if (!item || existingById[item.id] !== item) {
      return false;
    }
  }

  return true;
}

/**
 * Fonction helper pour comparer une valeur avec une condition
 * Version optimisée avec support complet des dates
 */
const matchesOperator = (val: any, condition: any): boolean => {
  // Si condition est une valeur primitive → équivalent à $eq
  if (condition === null || typeof condition !== "object" || Array.isArray(condition)) {
    return val === condition;
  }

  // Gestion des opérateurs avec support Date complet
  if (condition.$eq !== undefined) return val === condition.$eq;
  if (condition.$ne !== undefined) return val !== condition.$ne;

  if (condition.$gt !== undefined) {
    if (val instanceof Date && condition.$gt instanceof Date) {
      return val.getTime() > condition.$gt.getTime();
    }
    return val > condition.$gt;
  }

  if (condition.$gte !== undefined) {
    if (val instanceof Date && condition.$gte instanceof Date) {
      return val.getTime() >= condition.$gte.getTime();
    }
    return val >= condition.$gte;
  }

  if (condition.$lt !== undefined) {
    if (val instanceof Date && condition.$lt instanceof Date) {
      return val.getTime() < condition.$lt.getTime();
    }
    return val < condition.$lt;
  }

  if (condition.$lte !== undefined) {
    if (val instanceof Date && condition.$lte instanceof Date) {
      return val.getTime() <= condition.$lte.getTime();
    }
    return val <= condition.$lte;
  }

  if (condition.$in !== undefined) return condition.$in.includes(val);

  if (condition.$contains !== undefined && typeof val === "string") {
    return val.includes(condition.$contains);
  }

  if (condition.$startsWith !== undefined && typeof val === "string") {
    return val.startsWith(condition.$startsWith);
  }

  if (condition.$endsWith !== undefined && typeof val === "string") {
    return val.endsWith(condition.$endsWith);
  }

  if (condition.$between !== undefined) {
    if (!Array.isArray(condition.$between) || condition.$between.length !== 2) {
      return false;
    }

    const [min, max] = condition.$between;

    // Support Date pour $between
    if (val instanceof Date && min instanceof Date && max instanceof Date) {
      const time = val.getTime();
      return time >= min.getTime() && time <= max.getTime();
    }

    return val >= min && val <= max;
  }

  // Si aucun opérateur reconnu → égalité par défaut
  return val === condition;
};

const isPlainObject = (value: any): boolean =>
  value !== null &&
  typeof value === 'object' &&
  !(value instanceof Date) &&
  !Array.isArray(value) &&
  value.constructor === Object;

/**
 * Compile les filtres en fonctions optimisées
 */
const compileFilters = <T>(where: PartialDeep<T>) => {
  const filters: Array<{ test: (item: T) => boolean }> = [];

  const compileRecursive = (obj: any, path: string[] = []) => {
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = [...path, key];

      if (isPlainObject(value) && !isOperatorObject(value)) {
        // Exploration récursive des objets nested
        compileRecursive(value, currentPath);
      } else {
        // Création du filtre pour cette propriété
        filters.push(createFilterTest(currentPath, value));
      }
    });
  };

  compileRecursive(where);
  return filters;
};

const createFilterTest = (path: string[], condition: any) => {
  const getValue = createValueGetter(path); // ← OPTIMISATION CRITIQUE

  return {
    test: (item: any) => matchesOperator(getValue(item), condition)
  };
};

/**
 * Filtre récursif optimisé avec cache WeakMap et getters pré-compilés
 */
export const useFilterFn = <T>(where?: PartialDeep<T>): ((item: T) => boolean) | undefined => {
  const cache = FilterCache.getInstance();

  return useMemo(() => {
    if (!where) return undefined;

    // ✅ VÉRIFICATION DU CACHE
    const cachedFn = cache.get<(item: T) => boolean>(where);
    if (cachedFn) {
      return cachedFn;
    }

    // ✅ COMPILATION AVEC GETTERS OPTIMISÉS
    const compiledFilters = compileFilters(where);

    const filterFn = (item: T) => {
      // Évaluation court-circuit : s'arrête au premier échec
      for (const filter of compiledFilters) {
        if (!filter.test(item)) return false;
      }
      return true;
    };

    // ✅ MISE EN CACHE
    cache.set(where, filterFn);
    return filterFn;
  }, [where]);
};

/**
 * Tri optimisé avec getters pré-compilés
 */
export const useSortFn = <T>(
  sort?: { key: string; order: "asc" | "desc" }
): ((a: T, b: T) => number) | undefined => {
  return useMemo(() => {
    if (!sort) return undefined;

    // OPTIMISATION : Pré-compilation avec createValueGetter
    const getValue = createValueGetter(sort.key.split("."));
    const order = sort.order;

    return (a: T, b: T) => {
      // Appels DIRECTS optimisés
      const aVal = getValue(a);
      const bVal = getValue(b);

      // Gestion des valeurs null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return order === "asc" ? 1 : -1;
      if (bVal == null) return order === "asc" ? -1 : 1;

      // Comparaison optimisée par type
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Gestion des dates
      if (aVal instanceof Date && bVal instanceof Date) {
        const diff = aVal.getTime() - bVal.getTime();
        return order === "asc" ? diff : -diff;
      }

      // Conversion en string pour la comparaison
      const aStr = String(aVal);
      const bStr = String(bVal);

      return order === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    };
  }, [sort?.key, sort?.order]);
};

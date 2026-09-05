// src/hooks/entity/cache.ts

import { useRef } from "react";
import isEqual from 'fast-deep-equal';

export class FilterCache {
    private static instance: FilterCache;
    private cache: WeakMap<object, any>;
  
    private constructor() {
      this.cache = new WeakMap();
    }
  
    static getInstance(): FilterCache {
      if (!FilterCache.instance) {
        FilterCache.instance = new FilterCache();
      }
      return FilterCache.instance;
    }
  
    get<T>(key: object): T | undefined {
      return this.cache.get(key);
    }
  
    set<T>(key: object, value: T): void {
      this.cache.set(key, value);
    }
}

export const useDeepMemo = <T>(value: T): T => {
  const ref = useRef<T>(value);

  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }
  
  return ref.current;
};

export const createValueGetter = (path: string[]) => {
  // Cas simple : accès direct - optimisation maximale
  if (path.length === 1) {
    const key = path[0];
    return (item: any) => item[key];
  }

  // Cas nested : boucle optimisée avec arrêt précoce
  return (item: any) => {
    let value = item;
    for (let i = 0; i < path.length; i++) {
      if (value == null) return undefined;
      value = value[path[i]];
    }
    return value;
  };
};

// Helper pour vérifier si un objet contient des opérateurs
export const isOperatorObject = (obj: any): boolean => {
  if (!obj || typeof obj !== 'object') return false;
  
  const operatorKeys = ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$contains', '$startsWith', '$endsWith', '$between'];
  return Object.keys(obj).some(key => operatorKeys.includes(key));
};

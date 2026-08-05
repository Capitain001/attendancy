// lib/optimistic-helpers.ts
import { useQueryClient } from "@tanstack/react-query";

// Types génériques
export type SupabaseResponse<T> = {
  data: T[] | null;
  error: any;
  count: number | null;
  status: number;
  statusText: string;
};

export type OptimisticUpdate<T> = {
  queryKey: any[];
  item: Partial<T>;
  id: string | number;
};

export type OptimisticCreate<T> = {
  queryKey: any[];
  item: T;
};

export type OptimisticDelete = {
  queryKey: any[];
  id: string | number;
};

export type OptimisticReorder = {
  queryKey: any[];
  fromIndex: number;
  toIndex: number;
};

// Hook principal
export function useOptimisticHelpers() {
  const queryClient = useQueryClient();

  // Mise à jour d'un élément
  const updateItem = <T extends { id: string | number }>({
    queryKey,
    item,
    id
  }: OptimisticUpdate<T>) => {
    queryClient.setQueryData(queryKey, (old: SupabaseResponse<T> | undefined) => {
      if (!old?.data) return old;
      
      return {
        ...old,
        data: old.data.map(existingItem =>
          existingItem.id === id ? { ...existingItem, ...item } : existingItem
        )
      };
    });
  };

  // Création d'un élément
  const createItem = <T>({ queryKey, item }: OptimisticCreate<T>) => {
    queryClient.setQueryData(queryKey, (old: SupabaseResponse<T> | undefined) => {
      const currentData = old?.data || [];
      
      return {
        ...old || {
          error: null,
          count: null,
          status: 200,
          statusText: 'OK'
        },
        data: [...currentData, item],
        count: (old?.count || 0) + 1
      };
    });
  };

  // Suppression d'un élément
  const deleteItem = <T extends { id: string | number }>({ 
    queryKey, 
    id 
  }: OptimisticDelete) => {
    queryClient.setQueryData(queryKey, (old: SupabaseResponse<T> | undefined) => {
      if (!old?.data) return old;
      
      const newData = old.data.filter(item => item.id !== id);
      
      return {
        ...old,
        data: newData,
        count: Math.max((old.count || 1) - 1, 0)
      };
    });
  };

  // Réorganisation d'éléments
  const reorderItems = <T>({ 
    queryKey, 
    fromIndex, 
    toIndex 
  }: OptimisticReorder) => {
    queryClient.setQueryData(queryKey, (old: SupabaseResponse<T> | undefined) => {
      if (!old?.data) return old;
      
      const newData = [...old.data];
      const [movedItem] = newData.splice(fromIndex, 1);
      newData.splice(toIndex, 0, movedItem);
      
      return { ...old, data: newData };
    });
  };

  // Toggle booléen
  const toggleBoolean = <T extends { id: string | number }>({
    queryKey,
    id,
    property
  }: OptimisticUpdate<T> & { property: keyof T }) => {
    queryClient.setQueryData(queryKey, (old: SupabaseResponse<T> | undefined) => {
      if (!old?.data) return old;
      
      return {
        ...old,
        data: old.data.map(item =>
          item.id === id 
            ? { ...item, [property]: !item[property] } 
            : item
        )
      };
    });
  };

  return {
    updateItem,
    createItem,
    deleteItem,
    reorderItems,
    toggleBoolean
  };
}
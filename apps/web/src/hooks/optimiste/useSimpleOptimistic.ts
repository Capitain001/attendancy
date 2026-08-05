'use client'
import { useQueryClient } from "@tanstack/react-query";

// Version ultra-simplifiée
export function useSimpleOptimistic() {
    const queryClient = useQueryClient();
  
    const optimistic = {
      // Mettre à jour un champ spécifique
      update: <T>(queryKey: any[], id: string, updates: Partial<T>) => {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((item: any) =>
              item.id === id ? { ...item, ...updates } : item
            )
          };
        });
      },
  
      // Ajouter un élément
      add: <T>(queryKey: any[], newItem: T) => {
        queryClient.setQueryData(queryKey, (old: any) => {
          const currentData = old?.data || [];
          return {
            ...old || { error: null, count: null, status: 200, statusText: 'OK' },
            data: [...currentData, newItem],
            count: (old?.count || 0) + 1
          };
        });
      },
  
      // Supprimer un élément
      remove: (queryKey: any[], id: string) => {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old?.data) return old;
          const newData = old.data.filter((item: any) => item.id !== id);
          return {
            ...old,
            data: newData,
            count: Math.max((old.count || 1) - 1, 0)
          };
        });
      }
    };
  
    return optimistic;
  }
  
  // Utilisation ultra-simple
//   const { update, add, remove } = useSimpleOptimistic();

  /* donnee mock */
//   const academicYearQueryKey =['academic-years'];
//   const itemId = '123';
//   const newItem = { id: '456', name: 'Nouveau nom' };


//   // Renommer
//   update(academicYearQueryKey, itemId, { name: 'Nouveau nom' });
  
//   // Ajouter
//   add(academicYearQueryKey, newItem);
  
//   // Supprimer  
//   remove(academicYearQueryKey, itemId);
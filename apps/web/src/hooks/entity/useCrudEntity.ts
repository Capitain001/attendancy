// hooks/entity/useCrudEntity.ts
"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEntity } from "./useEntity";

interface CrudConfig<T, CreateInput = any, UpdateInput = any> {
  create?: (data: CreateInput) => Promise<T>;
  update?: (id: string, data: UpdateInput) => Promise<T>;
  delete?: (id: string) => Promise<void>;
  
  // Messages optionnels
  messages?: {
    create?: string;
    update?: string;
    delete?: string;
    error?: string; // Message d'erreur générique
  };
}

interface UseCrudEntityOptions<T, CreateInput = any, UpdateInput = any> {
  entityName: string;
  fetchFn: () => Promise<T[]>;
  crud?: CrudConfig<T, CreateInput, UpdateInput>;
  
  // Options useEntity standard
  transformFn?: (items: T[]) => any;
  staleTime?: number;
  enabled?: boolean;
}

export function useCrudEntity<
  T extends { id: string },
  CreateInput = any,
  UpdateInput = any
>(options: UseCrudEntityOptions<T, CreateInput, UpdateInput>) {
  const { entityName, fetchFn, crud, ...entityOptions } = options;
  
  // ✅ Utilise useEntity existant
  const entity = useEntity({
    entityName,
    fetchFn,
    revalidateMode: crud ? "patch" : undefined, // Active applyPayload seulement si CRUD
    ...entityOptions
  });

  // 🔄 CREATE Mutation
  const createMutation = useMutation({
    mutationFn: crud?.create!,
    onSuccess: (newItem) => {
      // Mise à jour optimiste IMMÉDIATE
      entity.queryClient.setQueryData(
        [entityName], 
        (old: any) => {
          const items = Array.isArray(old) ? old : old?.items || [];
          return [...items, newItem];
        }
      );
      
      const message = crud?.messages?.create;
      if (message) toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || crud?.messages?.error || "Erreur");
    }
  });

  // 🔄 UPDATE Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInput }) => 
      crud?.update!(id, data) as Promise<T>,
    
    onSuccess: (updatedItem) => {
      // Mise à jour optimiste IMMÉDIATE
      entity.queryClient.setQueryData(
        [entityName], 
        (old: any) => {
          const items = Array.isArray(old) ? old : old?.items || [];
          return items.map((item: T) => 
            item.id === updatedItem.id ? updatedItem : item
          );
        }
      );
      
      const message = crud?.messages?.update;
      if (message) toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || crud?.messages?.error || "Erreur");
    }
  });

  // 🔄 DELETE Mutation
  const deleteMutation = useMutation({
    mutationFn: crud?.delete!,
    onSuccess: (_, id) => {
      // Mise à jour optimiste IMMÉDIATE
      entity.queryClient.setQueryData(
        [entityName], 
        (old: any) => {
          const items = Array.isArray(old) ? old : old?.items || [];
          return items.filter((item: T) => item.id !== id);
        }
      );
      
      const message = crud?.messages?.delete;
      if (message) toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || crud?.messages?.error || "Erreur");
    }
  });

  // 🎯 Retourne TOUJOURS la structure useEntity + mutations si configurées
  return {
    // ✅ Données de base (toujours présentes)
    ...entity,
    
    // ✅ Mutations (seulement si configurées)
    ...(crud?.create && {
      create: createMutation.mutateAsync,
      isCreating: createMutation.isPending,
      createError: createMutation.error
    }),
    
    ...(crud?.update && {
      update: updateMutation.mutateAsync,
      isUpdating: updateMutation.isPending,
      updateError: updateMutation.error
    }),
    
    ...(crud?.delete && {
      delete: deleteMutation.mutate,
      isDeleting: deleteMutation.isPending,
      deleteError: deleteMutation.error
    })
  };
}
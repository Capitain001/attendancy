// src/hooks/data/fonctions/useFonctions.ts
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import { 
  addFunctionAction, 
  updateFunctionAction, 
  removeFunctionAction, 
  getFunctionsAction 
} from "@/services/fonctions/actions";
import type { Function, AddFunctionData, UpdateFunctionData } from "@/services/fonctions/types";

// Types pour les inputs du hook
export type CreateFunctionInput = Omit<AddFunctionData, "orgId">;
export type UpdateFunctionInput = UpdateFunctionData;

export interface UseFonctionsOptions {
  isMain?: boolean;
  staleTime?: number;
  enabled?: boolean;
}

/**
 * Hook pour gérer les fonctions avec CRUD complet
 * 
 * @example
 * ```tsx
 * const { data, create, update, delete: deleteFunction, loading } = useFonctions();
 * 
 * // Créer une fonction
 * await create({ name: "Directeur", description: "Direction de l'établissement", isMain: true });
 * 
 * // Mettre à jour
 * await update({ id: "function-123", data: { name: "Directeur Général" } });
 * 
 * // Supprimer
 * deleteFunction("function-123");
 * ```
 */
export function useFonctions(options: UseFonctionsOptions = {}) {
  const { isMain, staleTime, enabled } = options;

  const fetchFn = toFetchFn(getFunctionsAction, { isMain });
  const create = toCreateFn(addFunctionAction);
  const update = toUpdateFn((id: string, data: UpdateFunctionInput) => updateFunctionAction({ id, data }));
  const deleteFunction = toDeleteFn<string>(async (id) => {
    const r = await removeFunctionAction(id);
    return 'error' in r ? { success: false as const, error: r.error } : { success: true as const };
  });

  return useCrudEntity<Function, CreateFunctionInput, UpdateFunctionInput>({
    entityName: "functions",
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: deleteFunction,
      messages: {
        create: "Fonction créée avec succès",
        update: "Fonction modifiée avec succès",
        delete: "Fonction supprimée avec succès",
        error: "Une erreur est survenue"
      }
    }
  });
}


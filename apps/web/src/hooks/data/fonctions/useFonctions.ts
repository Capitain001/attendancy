// src/hooks/data/fonctions/useFonctions.ts
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import {
  createFunctionAction,
  updateFunctionAction,
  deleteFunctionAction,
  getFunctionsAction
} from "@/services/function/actions";
import type { FunctionItem } from "@/services/function/types";
import type { CreateFunctionInput as ServiceCreateInput, UpdateFunctionInput as ServiceUpdateInput } from "@/services/function/validation";

// Types pour les inputs du hook
export type CreateFunctionInput = ServiceCreateInput;
export type UpdateFunctionInput = Omit<ServiceUpdateInput, 'functionId'>;

export interface UseFonctionsOptions {
  isMain?: boolean;
  staleTime?: number;
  enabled?: boolean;
}

export function useFonctions(options: UseFonctionsOptions = {}) {
  const { isMain, staleTime, enabled } = options;

  const fetchFn = toFetchFn(getFunctionsAction, { isMain });
  const create = toCreateFn(createFunctionAction);
  const update = toUpdateFn((id: string, data: UpdateFunctionInput) => updateFunctionAction({ functionId: id, ...data }));
  const deleteFunction = toDeleteFn<string>(async (id) => {
    const r = await deleteFunctionAction(id);
    return 'error' in r ? { success: false as const, error: r.error } : { success: true as const };
  });

  return useCrudEntity<FunctionItem, CreateFunctionInput, UpdateFunctionInput>({
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

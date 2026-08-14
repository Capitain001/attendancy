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
import type { CreateFunctionInput as ServiceCreateInput } from "@/services/function/validation";
import type { UpdateFunctionDataInput } from "@/services/function/validation";

// Types pour les inputs du hook
export type CreateFunctionInput = ServiceCreateInput;
export type UpdateFunctionInput = UpdateFunctionDataInput;

export interface UseFonctionsOptions {
  isMain?: boolean;
  staleTime?: number;
  enabled?: boolean;
}

export function useFonctions(options: UseFonctionsOptions = {}) {
  const { isMain, staleTime, enabled } = options;

  const fetchFn = toFetchFn(getFunctionsAction, { isMain });
  const create = toCreateFn(createFunctionAction);
  // ✅ aucun générique explicite requis : TResponse s'infère depuis
  // updateFunctionAction lui-même, TId/TInput utilisent leurs defaults
  // (string / object), suffisamment larges pour matcher UpdateFunctionInput
  // au moment de l'assignation à crud.update plus bas.
  const update = toUpdateFn(updateFunctionAction, "functionId");
  const deleteFunction = toDeleteFn(deleteFunctionAction);

  return useCrudEntity<FunctionItem, CreateFunctionInput, UpdateFunctionInput>({
    entityName: "functions",
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      // ✅ createFunctionAction ne renvoie pas _count (une fonction neuve a
      // toujours 0 utilisateur) : createDefaults comble ce champ sans avoir
      // à le requêter côté serveur.
      createDefaults: { _count: { users: 0 } },
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
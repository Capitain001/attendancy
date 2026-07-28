// src/hooks/data/classes/useClasses.ts
//@ts-nocheck
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import {
  toFetchFn,
  toCreateFn,
  toUpdateFn,
  toDeleteFn,
} from "@/hooks/entity/actionHelpers";
import {
  addClassAction,
  updateClassAction,
  removeClassAction,
  getClassesAction,
} from "@/services/class/actions";
import type {
  AddClassData,
  UpdateClassData,
} from "@/services/class/database";
import { ClasseDTo } from "@/services/class/types";

// Inputs
export type CreateClassInput = AddClassData;
export type UpdateClassInput = UpdateClassData;

export interface UseClassesOptions {
  yearId?: string;
  programTrackId?: string;
  staleTime?: number;
  enabled?: boolean;
}

/**
 * Hook CRUD pour la gestion des classes
 *
 * - Récupération des classes par organisation
 * - Filtres optionnels par année académique ou programTrack
 * - Création, mise à jour et suppression logique
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   create,
 *   update,
 *   delete: deleteClass,
 *   loading,
 * } = useClasses({
 *   yearId: "year-123",
 *   programTrackId: "track-456",
 * });
 *
 * // Créer une classe
 * await create({
 *   name: "6ème A",
 *   programTrackId: "track-456",
 * });
 *
 * // Mettre à jour
 * await update({
 *   id: "class-123",
 *   data: { name: "6ème B" },
 * });
 *
 * // Supprimer
 * deleteClass("class-123");
 * ```
 */
export function useClasses(options: UseClassesOptions = {}) {
  const { yearId, programTrackId, staleTime, enabled } = options;

  // 🔗 Actions alignées avec l’API
  const fetchFn = toFetchFn(getClassesAction, {
    yearId,
    programTrackId,
  });

  const create = toCreateFn(addClassAction);
  const update = toUpdateFn(updateClassAction);
  const deleteClass = toDeleteFn(removeClassAction);

  return useCrudEntity<ClasseDTo, CreateClassInput, UpdateClassInput>({
    entityName: "classes",
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: deleteClass,
      messages: {
        create: "Classe créée avec succès",
        update: "Classe modifiée avec succès",
        delete: "Classe supprimée avec succès",
        error: "Une erreur est survenue",
      },
    },
  });
}

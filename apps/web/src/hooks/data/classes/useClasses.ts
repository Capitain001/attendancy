// src/hooks/data/classes/useClasses.ts
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import {
  toFetchFn,
  toCreateFn,
  toUpdateFn,
  toDeleteFn,
} from "@/hooks/entity/actionHelpers";
import {
  createClassAction,
  updateClassAction,
  removeClassAction,
  getClassesAction,
} from "@/services/class";
import type {
  CreateClassInput,
  UpdateClassDataInput,
} from "@/services/class";
import { GetClassesDto } from "@/services/class";
import { Level } from "@/generated/prisma";

// Inputs
// export type CreateClassInput;
export type ClassDto = GetClassesDto[number];
export interface UseClassesOptions {
  yearId?: string;
  programTrackId?: string;
  name?: string;
  level?: Level;
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
  const { yearId, programTrackId, name, level, staleTime, enabled } = options;
  // 🔗 Actions alignées avec l’API
  const fetchFn = toFetchFn(getClassesAction, {
    yearId,
    programTrackId,
    name,
    level,
  })

  const create = toCreateFn(createClassAction);

  // updateClassAction suit la norme V2 : id + payload imbriqué sous `data`
  // ({ classId, data: {...} }) — c'est cette forme qui sert désormais de
  // référence pour toUpdateFn (cf. actionHelpers.ts).
  const update = toUpdateFn(updateClassAction, "classId");

  const deleteClass = toDeleteFn(removeClassAction);

  return useCrudEntity<ClassDto, CreateClassInput, UpdateClassDataInput>({
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
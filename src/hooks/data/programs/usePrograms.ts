"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import {
  toFetchFn,
  toCreateFn,
  toUpdateFn,
  toDeleteFn,
} from "@/hooks/entity/actionHelpers";
import {
  addProgramAction,
  getProgramsAction,
  updateProgramAction,
  removeProgramAction,
} from "@/services/program/actions";
import type {
  AddProgramData,
  UpdateProgramData,
} from "@/services/program/database";
import type { ProgramDto } from "@/services/program/types";

// Inputs
export type CreateProgramInput = AddProgramData;
export type UpdateProgramInput = UpdateProgramData;

export interface UseProgramsOptions {
  classId?: string;
  programTrackId?: string;
  staleTime?: number;
  enabled?: boolean;
}

/**
 * Hook CRUD pour Program
 */
export function usePrograms(options: UseProgramsOptions = {}) {
  const { classId,programTrackId, staleTime, enabled } = options;

  const fetchFn = toFetchFn(getProgramsAction, { classId ,programTrackId });
  const create = toCreateFn(addProgramAction);
  const update = toUpdateFn(updateProgramAction);
  const remove = toDeleteFn(removeProgramAction);

  return useCrudEntity<
    ProgramDto,
    CreateProgramInput,
    UpdateProgramInput
  >({
    entityName: "programs",
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: remove,
      messages: {
        create: "Programme créé avec succès",
        update: "Programme modifié avec succès",
        delete: "Programme supprimé avec succès",
        error: "Une erreur est survenue",
      },
    },
  });
}

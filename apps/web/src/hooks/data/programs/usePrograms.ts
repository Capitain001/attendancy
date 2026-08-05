"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import {
  toFetchFn,
  toCreateFn,
  toUpdateFn,
  toDeleteFn,
  type ActionDeleteResponse,
} from "@/hooks/entity/actionHelpers";
import {
  createProgramAction,
  getProgramsAction,
  updateProgramAction,
  removeProgramAction,
} from "@/services/program/actions";
import type {
  CreateProgramInput,
  UpdateProgramInput,
} from "@/services/program/validation";
import type { ProgramDto } from "@/services/program/types";

export type { CreateProgramInput, UpdateProgramInput };

export interface UseProgramsOptions {
  classId?: string;
  programTrackId?: string;
  staleTime?: number;
  enabled?: boolean;
}

export function usePrograms(options: UseProgramsOptions = {}) {
  const { classId, programTrackId, staleTime, enabled } = options;

  const fetchFn = toFetchFn(getProgramsAction, { classId, programTrackId });
  const create = toCreateFn(createProgramAction);
  const update = toUpdateFn(updateProgramAction);
  const remove = toDeleteFn(
    removeProgramAction as (id: string) => Promise<ActionDeleteResponse>
  );

  return useCrudEntity<ProgramDto, CreateProgramInput, UpdateProgramInput>({
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

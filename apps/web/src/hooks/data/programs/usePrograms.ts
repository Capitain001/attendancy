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
} from "@/services/program/validation";
import type { UpdateProgramDataInput } from "@/services/program/validation";
import type { GetProgramsDto } from "@/services/program/types";

export type { CreateProgramInput };

type ProgramDto = GetProgramsDto[number]

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
  const update = toUpdateFn(updateProgramAction, "programId");
  const remove = toDeleteFn(removeProgramAction);

  return useCrudEntity<ProgramDto, CreateProgramInput, UpdateProgramDataInput>({
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

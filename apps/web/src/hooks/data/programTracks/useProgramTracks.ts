// src/hooks/data/programTracks/useProgramTracks.ts
// @ts-nocheck
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import {
  toFetchFn,
  toCreateFn,
  toUpdateFn,
  toDeleteFn,
} from "@/hooks/entity/actionHelpers";
import { AddProgramTrackData, UpdateProgramTrackData } from "@/services/program-track/database";
import { addProgramTrackAction, getProgramTracksAction, getProgramTracksBasicAction, removeProgramTrackAction, updateProgramTrackAction } from "@/services/program-track/actions";
import { ProgramTrackDto } from "@/services/program-track/types";


// Types pour les inputs du hook
export type CreateProgramTrackInput = AddProgramTrackData;
export type UpdateProgramTrackInput = UpdateProgramTrackData;

export interface UseProgramTracksOptions {
  departmentId?: string;
  staleTime?: number;
  enabled?: boolean;
}

// Type aligné sur le retour réel de getProgramTracksAction (sans _count)
export type ProgramTrackHook = Omit<ProgramTrackDto, "_count">;

/**
 * Hook pour gérer les ProgramTracks avec CRUD complet
 *
 * @example
 * ```tsx
 * const { data, create, update, delete: remove, loading } = useProgramTracks({ departmentId: "dep-123" });
 *
 * await create({ name: "Informatique", level: "L1", departmentId: "dep-123" });
 * await update({ id: "track-123", data: { name: "Informatique Appliquée" } });
 * remove("track-123");
 * ```
 */
export function useProgramTracks(options: UseProgramTracksOptions = {}) {
  const { departmentId, staleTime, enabled } = options;

  const fetchFn = toFetchFn(getProgramTracksBasicAction, { departmentId });
  const create = toCreateFn(addProgramTrackAction);
  const update = toUpdateFn(updateProgramTrackAction);
  const remove = toDeleteFn(removeProgramTrackAction);

  return useCrudEntity<ProgramTrackDto, CreateProgramTrackInput, UpdateProgramTrackInput>({
    entityName: "programTracks",
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

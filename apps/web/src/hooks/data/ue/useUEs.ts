"use client";
import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import {
  getUEsAction,
  createUEAction,
  archiveUEAction,
  updateUEAction
} from '@/services/ue'
import type { GetUEsDto } from '@/services/ue/generated.types'
import type { CreateUEInput as ServiceCreateInput } from '@/services/ue/validation'
import type { UpdateUEData } from '@/services/ue/database'

type UEItem = GetUEsDto[number]
export type CreateUEInput = { data: ServiceCreateInput, programId?: string, semester?: number, order?: number }
export type UpdateUEInput = UpdateUEData

export interface UseUEsOptions {
  departmentId?: string;
  staleTime?: number;
  enabled?: boolean;
}

export function useUEs(options: UseUEsOptions = {}) {
  const { departmentId, staleTime, enabled } = options;
  const fetchFn = toFetchFn(getUEsAction, departmentId);
  const create = toCreateFn(createUEAction);
  const update = toUpdateFn(updateUEAction, "ueId");
  const archive = toDeleteFn(archiveUEAction);

  return useCrudEntity<UEItem, CreateUEInput, UpdateUEInput>({
    entityName: `ues${departmentId ? `-${departmentId}` : ''}`,
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: archive,
      messages: {
        create: "UE créée avec succès",
        update: "UE mise à jour avec succès",
        delete: "UE archivée avec succès",
        error: "Une erreur est survenue"
      }
    }
  });
}

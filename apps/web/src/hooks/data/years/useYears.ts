//src/hooks/data/useYears.ts
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { 
  toFetchFn, 
  toCreateFn, 
  toUpdateFn, 
  toDeleteFn 
} from "@/hooks/entity/actionHelpers";



import type { AcademicYearItem, CreateAcademicYearInput, UpdateAcademicYearData } from "@/services/academic-year";
import { createYearAction, deleteYearAction, getYearsAction, updateYearAction } from "@/services/academic-year";

// Types Input : on retire orgId car il est trouvé via getUserInfo()
export type CreateYearInput = Omit<CreateAcademicYearInput, "orgId">;
export type UpdateYearInput = UpdateAcademicYearData;

export interface UseYearsOptions {
  staleTime?: number;
  enabled?: boolean;
}

export function useYears(options: UseYearsOptions = {}) {
  const { staleTime, enabled } = options;

  // Helpers CRUD
  const fetchFn = toFetchFn(getYearsAction);
  const create = toCreateFn(createYearAction);
  const update = toUpdateFn(updateYearAction);
  const deleteYear = toDeleteFn<string>(async (id) => {
    const r = await deleteYearAction(id);
    return { success: !('error' in r), error: 'error' in r ? r.error : undefined };
  });

  return useCrudEntity<AcademicYearItem, CreateYearInput, UpdateYearInput>({
    entityName: "years",
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: deleteYear,
      messages: {
        create: "Année académique créée avec succès",
        update: "Année académique modifiée avec succès",
        delete: "Année académique supprimée avec succès",
        error: "Une erreur est survenue"
      }
    }
  });
}

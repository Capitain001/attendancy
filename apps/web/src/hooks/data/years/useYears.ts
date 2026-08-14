//src/hooks/data/useYears.ts
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { 
  toFetchFn, 
  toCreateFn, 
  toUpdateFn, 
  toDeleteFn 
} from "@/hooks/entity/actionHelpers";



import type { AcademicYearItem, CreateAcademicYearInput } from "@/services/academic-year";
import type { UpdateAcademicYearDataInput } from "@/services/academic-year/validation";
import { createAcademicYearAction, removeAcademicYearAction, getAcademicYearsAction, updateAcademicYearAction } from "@/services/academic-year";

// Types Input : on retire orgId car il est trouvé via getUserInfo()
export type CreateYearInput = Omit<CreateAcademicYearInput, "orgId">;

export interface UseYearsOptions {
  staleTime?: number;
  enabled?: boolean;
}

export function useYears(options: UseYearsOptions = {}) {
  const { staleTime, enabled } = options;

  // Helpers CRUD
  const fetchFn = toFetchFn(getAcademicYearsAction);
  const create = toCreateFn(createAcademicYearAction);
  const update = toUpdateFn(updateAcademicYearAction, "academicYearId");
  const deleteYear = toDeleteFn(removeAcademicYearAction);

  return useCrudEntity<AcademicYearItem, CreateYearInput, UpdateAcademicYearDataInput>({
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

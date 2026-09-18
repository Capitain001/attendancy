"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import {
  createTeacherUnavailabilityAction,
  updateTeacherUnavailabilityAction,
  deleteTeacherUnavailabilityAction,
} from "@/services/teacher-unavailability/actions/teacher-unavailability.mutations";
import { getTeacherUnavailabilitiesAction } from "@/services/teacher-unavailability/actions/teacher-unavailability.queries";
import type { TeacherUnavailabilityItem } from "@/services/teacher-unavailability/types";
import type {
  CreateUnavailabilityInput,
  UpdateUnavailabilityDataInput,
} from "@/services/teacher-unavailability/validation";

export interface UseTeacherUnavailabilitiesOptions {
  teacherId: string;
  staleTime?: number;
  enabled?: boolean;
}

export function useTeacherUnavailabilities(options: UseTeacherUnavailabilitiesOptions) {
  const { teacherId, staleTime, enabled } = options;

  const fetchFn = toFetchFn(getTeacherUnavailabilitiesAction, teacherId);
  const create = toCreateFn(createTeacherUnavailabilityAction);
  const update = toUpdateFn(updateTeacherUnavailabilityAction, "teacherUnavailabilityId");
  const deleteFn = toDeleteFn((id: string) => deleteTeacherUnavailabilityAction({ teacherUnavailabilityId: id }));

  return useCrudEntity<TeacherUnavailabilityItem, CreateUnavailabilityInput, UpdateUnavailabilityDataInput>({
    entityName: "teacher-unavailabilities",
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: deleteFn,
      messages: {
        create: "Indisponibilité ajoutée avec succès",
        update: "Indisponibilité modifiée avec succès",
        delete: "Indisponibilité supprimée avec succès",
        error: "Une erreur est survenue",
      },
    },
  });
}

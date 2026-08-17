"use client";
import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import {
  createUECourseAction,
  updateUECourseAction,
  removeUECourseAction,
  getUECoursesAction
} from '@/services/ue-course'
import type { CreateUECourseInput as ServiceCreateInput, UpdateUECourseInput as ServiceUpdateInput } from '@/services/ue-course/validation'
import type { GetUECoursesByUEDto } from '@/services/ue-course/generated.types'

export type CreateUECourseInput = ServiceCreateInput;
export type UpdateUECourseInput = ServiceUpdateInput;

// Type de base attendu pour l'entité
type UECourseItem = GetUECoursesByUEDto[number]

export interface UseUECourseOptions {
  ueId: string;
  staleTime?: number;
  enabled?: boolean;
}

export function useUECourse(options: UseUECourseOptions) {
  const { ueId, staleTime, enabled } = options;
  const fetchFn = toFetchFn(getUECoursesAction, ueId);
  const create = toCreateFn(createUECourseAction);
  const update = toUpdateFn(updateUECourseAction, "ueCourseId");
  const remove = toDeleteFn(removeUECourseAction);

  return useCrudEntity<UECourseItem, CreateUECourseInput, UpdateUECourseInput>({
    entityName: `ue-courses-${ueId}`,
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: remove,
      messages: {
        create: "Élément constitutif ajouté avec succès",
        update: "Élément constitutif mis à jour",
        delete: "Élément constitutif supprimé",
        error: "Une erreur est survenue"
      }
    }
  });
}

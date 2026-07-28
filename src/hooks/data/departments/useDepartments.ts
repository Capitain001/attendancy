"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import {
  toFetchFn,
  toCreateFn,
  toUpdateFn,
  toDeleteFn,
} from "@/hooks/entity/actionHelpers";

import {
  addDepartmentAction,
  getDepartmentsAction,
  updateDepartmentByIdAction as updateDepartmentAction,
  removeDepartmentAction,
} from "@/services/department/actions";

import type { CreateDepartmentInput, DepartmentDto } from "@/services/department";

// Types pour les inputs du hook
export type UpdateDepartmentInput = Pick<CreateDepartmentInput, 'name'>;

export interface UseDepartmentsOptions {
  staleTime?: number;
  enabled?: boolean;
}

/**
 * Hook pour gérer les départements avec CRUD complet
 *
 * @example
 * ```tsx
 * const { data, create, update, delete: remove, loading } = useDepartments();
 *
 * await create({ name: "Informatique" });
 * await update({ id: "dep-123", data: { name: "Mathématiques" } });
 * remove("dep-123");
 * ```
 */
export function useDepartments(options: UseDepartmentsOptions = {}) {
  const { staleTime, enabled } = options;

  const fetchFn = toFetchFn(getDepartmentsAction);
  const create = toCreateFn(addDepartmentAction);
  const update = toUpdateFn(updateDepartmentAction);
  const remove = toDeleteFn(removeDepartmentAction);

  return useCrudEntity<
    DepartmentDto,
    CreateDepartmentInput,
    UpdateDepartmentInput
  >({
    entityName: "departments",
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: remove,
      messages: {
        create: "Département créé avec succès",
        update: "Département modifié avec succès",
        delete: "Département supprimé avec succès",
        error: "Une erreur est survenue",
      },
    },
  });
}

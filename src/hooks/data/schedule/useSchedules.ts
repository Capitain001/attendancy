// src/hooks/data/schedule/useSchedules.ts
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import {
  getSchedulesAction,
  createScheduleAction,
  updateScheduleAction,
  deleteScheduleAction,
} from "@/services/schedule/actions";
import type { Schedule } from "@/generated/prisma/client";

import type { CreateScheduleInput as AddScheduleData, GetSchedulesReturn, UpdateScheduleInput as UpdateScheduleData } from "@/services/schedule";

// Types pour les inputs du hook
export type CreateScheduleInput = Omit<AddScheduleData, "orgId">;
export type UpdateScheduleInput = UpdateScheduleData;

export interface UseSchedulesOptions {
  ruleId?: string;
  academicYearId?: string;
  staleTime?: number;
  enabled?: boolean;
}

/**
 * Hook pour gérer les schedules avec CRUD complet
 *
 * @example
 * ```tsx
 * const { data, create, update, delete: deleteSchedule, loading } = useSchedules({
 *   ruleId: "rule-123",
 * });
 *
 * // Créer un schedule
 * await create({
 *   courseId: "course-123",
 *   roomId: "room-123",
 *   academicYearId: "year-123",
 *   startTime: new Date(),
 *   endTime: new Date(),
 * });
 *
 * // Mettre à jour un schedule
 * await update({
 *   id: "schedule-123",
 *   data: { status: "COMPLETED" },
 * });
 *
 * // Supprimer
 * deleteSchedule("schedule-123");
 * ```
 */
export function useSchedules(options: UseSchedulesOptions = {}) {
  const { ruleId, academicYearId, staleTime, enabled } = options;

  // ✅ Utilisation des helpers réutilisables
  const fetchFn = toFetchFn(getSchedulesAction, { ruleId, academicYearId });
  const create = toCreateFn(createScheduleAction);
  // FIXME: useCrudEntity exige un retour full-entity sur update pour patcher le cache.
  // updateScheduleAction retourne intentionnellement { id } (mise à jour optimiste côté serveur).
  // À corriger quand useCrudEntity supportera une stratégie "invalidate" sur update.
  const update = toUpdateFn(updateScheduleAction) as (id: string, data: UpdateScheduleInput) => Promise<GetSchedulesReturn[number]>;
  // deleteScheduleAction renvoie { data, error } → adapter au contrat { success, error }.
  const deleteSchedule = toDeleteFn<string>(async (id) => {
    const r = await deleteScheduleAction(id);
    return { success: !r.error, error: r.error ?? undefined };
  });

  return useCrudEntity<GetSchedulesReturn[number], CreateScheduleInput, UpdateScheduleInput>({
    entityName: "schedules",
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: deleteSchedule,
      messages: {
        create: "Schedule créé avec succès",
        update: "Schedule modifié avec succès",
        delete: "Schedule supprimé avec succès",
        error: "Une erreur est survenue",
      },
    },
  });
}


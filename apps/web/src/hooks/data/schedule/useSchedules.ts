// src/hooks/data/schedule/useSchedules.ts
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import {
  getSchedulesAction,
  createScheduleAction,
  updateScheduleAction,
  deleteScheduleAction,
} from "@/services/schedule/actions";

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
 * // data peut être partiel : seuls les champs à changer.
 * // updateScheduleAction ne renvoie que { id } — le cache se met malgré
 * // tout à jour immédiatement avec les valeurs envoyées (voir useCrudEntity).
 * await update({
 *   id: "schedule-123",
 *   data: { status: "COMPLETED" },
 * });
 *
 * // Supprimer
 * await deleteSchedule("schedule-123");
 * ```
 */
export function useSchedules(options: UseSchedulesOptions = {}) {
  const { ruleId, academicYearId, staleTime, enabled } = options;

  // ✅ Utilisation des helpers réutilisables
  const fetchFn = toFetchFn(getSchedulesAction, { ruleId, academicYearId });
  const create = toCreateFn(createScheduleAction);

  // ⚠️ updateScheduleAction a une signature différente de updateFunctionAction :
  // l'id est un paramètre SÉPARÉ (scheduleId, input), pas fusionné dans un
  // objet unique. toUpdateFn (dans actionHelpers.ts) ne supporte que le
  // pattern "id fusionné" — on écrit donc ici un adaptateur minimal, local à
  // ce hook, plutôt que de forcer toUpdateFn à s'appliquer avec un cast.
  //
  // Le retour n'est PAS casté en entité complète (contrairement à avant) :
  // updateScheduleAction renvoie volontairement { id } seul, ce qui est
  // maintenant un cas normal et géré par useCrudEntity — il merge
  // {existant en cache} + {data envoyée par l'UI} + {retour serveur}, donc
  // { id } seul suffit pour que le cache reflète correctement le changement.
  const update = async (id: string, data: UpdateScheduleInput) => {
    const response = await updateScheduleAction(id, data);
    if ('error' in response) throw new Error(response.error);
    return response.data; // { id: string } — partiel, voir commentaire ci-dessus
  };

  // ✅ Simplifié : deleteScheduleAction renvoie { data: true } | { error },
  // ce qui correspond directement au contrat de toDeleteFn (n'importe quelle
  // forme de `data` est acceptée, seule la présence d'`error` compte).
  // L'ancien wrapper qui remappait vers { success, error } n'est plus
  // nécessaire.
  const deleteSchedule = toDeleteFn(deleteScheduleAction);

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
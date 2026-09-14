// src/hooks/data/planning/useTeacherDaySchedules.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns/format";

import { teacherDaySchedulesQuery } from "@/services/planning/queries";
import { GetSchedulesDto } from "@/services/schedule/generated.types";

export type UseTeacherDaySchedulesOptions = {
  teacherId: string;
  date: Date;
  initialTodaySchedules?: GetSchedulesDto;
};

/**
 * Séances du jour affiché sous le calendrier.
 * `initialData` : la page serveur a déjà chargé le jour courant (rangeStart/
 * rangeEnd = aujourd'hui) — on l'utilise comme donnée initiale UNIQUEMENT
 * quand `date` correspond à ce jour, pour éviter un fetch redondant au
 * premier rendu. Dès que l'utilisateur change de jour, le hook refetch
 * normalement (et bénéficie du cache si déjà visité).
 */
export function useTeacherDaySchedules({
  teacherId,
  date,
  initialTodaySchedules,
}: UseTeacherDaySchedulesOptions) {
  const dayKey = format(date, "yyyy-MM-dd");
  const todayKey = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    ...teacherDaySchedulesQuery({ teacherId, dayKey }),
    initialData: dayKey === todayKey ? initialTodaySchedules : undefined,
  });
}
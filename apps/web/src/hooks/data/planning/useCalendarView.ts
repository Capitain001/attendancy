// // src/hooks/data/planning/useCalendarView.ts
// "use client";

// import { useQuery } from "@tanstack/react-query";
// import { useMemo } from "react";
// import { useEntity } from "@/hooks/entity/useEntity";
// import { getGeneratedOccurrencesAction } from "@/services/planning/actions";
// import { getSchedulesAction } from "@/services/schedule/actions";
// // import { mergeGeneratedWithPersisted } from "@/services/planning/utils";
// import type { CalendarEntry, Occurrence } from "@/types/planning";
// import type { Schedule } from "@prisma/client";
// import type { EntityFetchFn } from "@/hooks/entity/types";

// export interface UseCalendarViewOptions {
//   orgId: string;
//   academicYearId: string;
//   start: Date;
//   end: Date;
//   staleTime?: number;
//   enabled?: boolean;
// }

// /**
//  * Hook pour récupérer la vue calendrier combinant occurrences générées et schedules persistés.
//  * 
//  * Ce hook :
//  * 1. Récupère les occurrences générées à partir des règles actives
//  * 2. Récupère les schedules persistés dans la période demandée
//  * 3. Fusionne les deux pour créer la vue calendrier finale
//  * 
//  * @example
//  * ```tsx
//  * const { data, isLoading, error, refetch } = useCalendarView({
//  *   orgId: "org-123",
//  *   academicYearId: "year-123",
//  *   start: new Date("2024-01-01"),
//  *   end: new Date("2024-12-31"),
//  * });
//  * 
//  * // data contient CalendarEntry[] avec isPersisted et scheduleId
//  * ```
//  */
// // Fonction helper pour convertir les dates string en objets Date
// function convertToDates<T extends { startTime: any; endTime: any }>(
//   items: T[]
// ): T[] {
//   return items.map((item) => ({
//     ...item,
//     startTime: item.startTime instanceof Date ? item.startTime : new Date(item.startTime),
//     endTime: item.endTime instanceof Date ? item.endTime : new Date(item.endTime),
//   }));
// }

// export function useCalendarView(options: UseCalendarViewOptions) {
//   const {
//     orgId,
//     academicYearId,
//     start,
//     end,
//     staleTime = 5 * 60 * 1000, // 5 minutes par défaut
//     enabled = true,
//   } = options;

//   // Récupération des occurrences générées
//   const {
//     data: occurrencesData,
//     isLoading: isLoadingOccurrences,
//     error: occurrencesError,
//     refetch: refetchOccurrences,
//   } = useQuery<Occurrence[]>({
//     queryKey: ["generated-occurrences", orgId, academicYearId],
//     queryFn: async () => {
//       const result = await getGeneratedOccurrencesAction({
//         orgId,
//         academicYearId,
//       });
//       if (result.error) {
//         throw new Error(result.error);
//       }
//       const occurrences = result.data || [];
//       // Convertir les dates string en objets Date si nécessaire
//       return convertToDates(occurrences) as Occurrence[];
//     },
//     staleTime,
//     enabled,
//   });

//   // Fonction de fetch pour les schedules avec les paramètres de date
//   // Les dates start et end sont capturées depuis la closure
//   const fetchSchedules: EntityFetchFn<Schedule> = async () => {
//     const result = await getSchedulesAction({
//       startDate: start,
//       endDate: end,
//     });
//     if (result.error) {
//       throw new Error(result.error);
//     }
//     const schedules = result.data || [];
//     // Convertir les dates string en objets Date si nécessaire
//     return convertToDates(schedules) as Schedule[];
//   };

//   // Récupération des schedules persistés via useEntity
//   const {
//     data: schedulesEntityData,
//     loading: isLoadingSchedules,
//     error: schedulesError,
//     refetch: refetchSchedules,
//   } = useEntity<Schedule>({
//     entityName: "schedules-calendar",
//     fetchFn: fetchSchedules,
//     initialParams: {
//       startDate: start.toISOString(),
//       endDate: end.toISOString(),
//     },
//     staleTime,
//     enabled,
//   });

//   // Extraire les schedules du format { items, byId }
//   const schedulesData = schedulesEntityData?.items || [];

//   // Fusion des occurrences et schedules pour créer la vue calendrier
//   const calendarEntries = useMemo<CalendarEntry[]>(() => {
//     if (!occurrencesData || !schedulesData) {
//       return [];
//     }

//     // return mergeGeneratedWithPersisted(occurrencesData, schedulesData, start, end);
//   }, [occurrencesData, schedulesData, start, end]);

//   // États combinés
//   const isLoading = isLoadingOccurrences || isLoadingSchedules;
//   const error = occurrencesError || schedulesError;

//   // Refetch combiné
//   const refetch = async () => {
//     await Promise.all([
//       refetchOccurrences(),
//       refetchSchedules(),
//     ]);
//   };

//   return {
//     data: calendarEntries,
//     isLoading,
//     isFetching: isLoadingOccurrences || isLoadingSchedules,
//     error,
//     refetch,
//     // Accès séparé aux données brutes si nécessaire
//     occurrences: occurrencesData || [],
//     schedules: schedulesData || [],
//   };
// }


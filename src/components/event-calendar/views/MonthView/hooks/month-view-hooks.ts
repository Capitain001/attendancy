import { useMemo, useState, useEffect, useCallback } from "react";

import { ScheduleEvent } from "@/components/event-calendar";
import { getEventVisibilityStats, getMonthViewDays, getWeekdayNames, groupDaysIntoWeeks } from "../utils/month-view-utils";

/**
 * Hook personnalisé pour gérer les données du calendrier mensuel
 *
 * @param currentDate - La date courante du calendrier
 * @returns Objet contenant les données calculées du calendrier
 *
 * Ce hook centralise tous les calculs liés à l'affichage du mois :
 * - Calcul des jours à afficher
 * - Génération des noms des jours de la semaine
 * - Organisation des jours en semaines
 */
export function useMonthViewData(currentDate: Date) {
  const days = useMemo(() => getMonthViewDays(currentDate), [currentDate]);

  const weekdays = useMemo(() => getWeekdayNames(), []);

  const weeks = useMemo(() => groupDaysIntoWeeks(days), [days]);

  return {
    days,
    weekdays,
    weeks,
  };
}

/**
 * Hook pour gérer l'état de montage du composant
 *
 * @returns Boolean indiquant si le composant est monté
 *
 * Utilisé pour éviter les problèmes d'hydratation SSR et s'assurer
 * que les calculs côté client sont cohérents.
 */
export function useMountedState() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

/**
 * Hook pour gérer les interactions avec les événements
 *
 * @param onEventSelect - Callback original pour la sélection d'événement
 * @returns Objet contenant les handlers d'événements
 *
 * Ce hook encapsule la logique de gestion des clics sur les événements,
 * notamment la prévention de la propagation.
 */
export function useEventHandlers(
  onEventSelect: (event: ScheduleEvent) => void
) {
  const handleEventClick = useCallback(
    (event: ScheduleEvent, e: React.MouseEvent) => {
      e.stopPropagation();
      onEventSelect(event);
    },
    [onEventSelect]
  );

  return {
    handleEventClick,
  };
}

/**
 * Hook pour gérer la logique de visibilité des événements d'un jour
 *
 * @param allDayEvents - Événements du jour (all-day + spanning)
 * @param allEvents - Tous les événements du jour
 * @param getVisibleEventCount - Fonction de calcul de visibilité
 * @param isMounted - État de montage du composant
 * @returns Objet contenant les données de visibilité
 */
export function useDayEventVisibility(
  allDayEvents: ScheduleEvent[],
  allEvents: ScheduleEvent[],
  getVisibleEventCount: (count: number) => number | undefined,
  isMounted: boolean
) {
  const visibilityData = useMemo(() => {
    const visibleCount = isMounted
      ? getVisibleEventCount(allDayEvents.length)
      : undefined;

    return getEventVisibilityStats(allDayEvents.length, visibleCount);
  }, [allDayEvents.length, getVisibleEventCount, isMounted]);

  return {
    visibleCount: visibilityData.canShow ? getVisibleEventCount(allDayEvents.length) : undefined,
    hasMore: visibilityData.hasMore,
    remainingCount: visibilityData.remainingCount,
    allEvents,
  };
}

/**
 * Hook pour gérer la création d'événements
 *
 * @param onEventCreate - Callback original pour la création d'événement
 * @returns Fonction de création d'événement avec heure par défaut
 */
export function useEventCreation(
  onEventCreate: (startTime: Date) => void
) {
  const createEventForDay = useCallback(
    (day: Date, defaultHour: number = 9) => {
      const startTime = new Date(day);
      startTime.setHours(defaultHour, 0, 0, 0);
      onEventCreate(startTime);
    },
    [onEventCreate]
  );

  return { createEventForDay };
}

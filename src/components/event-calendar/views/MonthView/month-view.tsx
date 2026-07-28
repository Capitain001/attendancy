"use client";

import React, { useEffect, useMemo, useState } from "react";

import { ScheduleEvent } from "@/components/event-calendar";
import { WeekdaysHeader } from "./components/WeekdaysHeader";
import { CalendarWeek } from "./components/CalendarWeek";
import { useEventVisibility } from "@/components/event-calendar";
import { EventHeight, EventGap } from "@/components/event-calendar";
import {
  getMonthViewDays,
  getWeekdayNames,
  groupDaysIntoWeeks,
} from "./utils/month-view-utils";

/**
 * Interface définissant les props du composant MonthView
 */
interface MonthViewProps {
  /** Date courante pour déterminer le mois à afficher */
  currentDate: Date;
  /** Liste des événements à afficher dans le calendrier */
  events: ScheduleEvent[];
  /** Callback appelé lors de la sélection d'un événement */
  onEventSelect: (event: ScheduleEvent) => void;
  /** Callback appelé lors de la création d'un nouvel événement */
  onEventCreate: (startTime: Date) => void;
}

/**
 * Composant principal pour l'affichage mensuel du calendrier
 *
 * Ce composant gère :
 * - L'affichage du mois complet avec les jours des mois précédent/suivant
 * - La répartition des événements sur les différents jours
 * - Les interactions utilisateur (sélection, création d'événements)
 * - La gestion de la visibilité des événements avec overflow
 */
export function MonthView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}: MonthViewProps) {
  // État pour gérer le montage du composant (hydratation SSR)
  const [isMounted, setIsMounted] = useState(false);

  // Hook personnalisé pour gérer la visibilité des événements
  const { contentRef, getVisibleEventCount } = useEventVisibility({
    eventHeight: EventHeight,
    eventGap: EventGap,
  });

  /**
   * Calcule tous les jours à afficher dans la grille du calendrier
   * Inclut les jours du mois précédent et suivant pour compléter les semaines
   */
  const days = useMemo(() => getMonthViewDays(currentDate), [currentDate]);

  /**
   * Génère les noms des jours de la semaine pour l'en-tête
   */
  const weekdays = useMemo(() => getWeekdayNames(), []);

  /**
   * Organise les jours en semaines pour l'affichage en grille
   */
  const weeks = useMemo(() => groupDaysIntoWeeks(days), [days]);

  /**
   * Gestionnaire pour le clic sur un événement
   * Empêche la propagation pour éviter les conflits avec les autres handlers
   */
  const handleEventClick = (event: ScheduleEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  // Marque le composant comme monté après l'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div data-slot="month-view" className="flex min-h-full flex-col">
      {/* En-tête avec les noms des jours de la semaine */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur">
        <WeekdaysHeader weekdays={weekdays} />
      </div>

      {/* Grille principale du calendrier */}
      <div className="grid auto-rows-fr">
        {weeks.map((week, weekIndex) => (
          <CalendarWeek
            key={`week-${weekIndex}`}
            week={week}
            weekIndex={weekIndex}
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
            onEventCreate={onEventCreate}
            isMounted={isMounted}
            getVisibleEventCount={getVisibleEventCount}
            contentRef={weekIndex === 0 ? contentRef : null}
          />
        ))}
      </div>
    </div>
  );
}

import React from "react";
import { format, isSameMonth, isToday } from "date-fns";
import {
  ScheduleEvent,
  DroppableCell,
  getAllEventsForDay,
  getEventsForDay,
  getSpanningEventsForDay,
} from "@/components/event-calendar";
import { DefaultStartHour } from "@/components/event-calendar/constants";
import { EventList } from "./EventList";
import { MoreEventsPopover } from "./MoreEventsPopover";
// import { ReusablePopover } from "@/components/ux/demo/ReusablePopover";
// import { EventUsers } from '@/components/ux/tools/EventUsers'

/**
 * Interface pour les props du composant CalendarDay
 */
interface CalendarDayProps {
  /** Date du jour à afficher */
  day: Date;
  /** Date courante du calendrier */
  currentDate: Date;
  /** Liste des événements à afficher */
  events: ScheduleEvent[];
  /** Callback pour le clic sur un événement */
  onEventClick: (event: ScheduleEvent, e: React.MouseEvent) => void;
  /** Callback pour la création d'un événement */
  onEventCreate: (startTime: Date) => void;
  /** État de montage du composant */
  isMounted: boolean;
  /** Fonction pour obtenir le nombre d'événements visibles */
  getVisibleEventCount: (eventCount: number) => number | undefined;
  /** Référence pour le calcul de visibilité */
  contentRef: React.RefObject<HTMLDivElement> | null;
}

/**
 * Composant représentant un jour individuel dans le calendrier mensuel
 *
 * Ce composant gère :
 * - L'affichage du numéro du jour avec les styles appropriés
 * - La liste des événements du jour
 * - Le popover pour les événements supplémentaires
 * - Les interactions de création d'événements
 * - Les styles conditionnels (jour actuel, hors du mois courant)
 */
export function CalendarDay({
  day,
  currentDate,
  events,
  onEventClick,
  onEventCreate,
  isMounted,
  getVisibleEventCount,
  contentRef,
}: CalendarDayProps) {
  // Calcul des événements pour ce jour
  const dayEvents = getEventsForDay(events, day);
  const spanningEvents = getSpanningEventsForDay(events, day);
  const allDayEvents = [...spanningEvents, ...dayEvents];
  const allEvents = getAllEventsForDay(events, day);

  // États et propriétés du jour
  const isCurrentMonth = isSameMonth(day, currentDate);
  const cellId = `month-cell-${day.toISOString()}`;

  // Calcul de la visibilité des événements
  const visibleCount = isMounted
    ? getVisibleEventCount(allDayEvents.length)
    : undefined;
  const hasMore =
    visibleCount !== undefined && allDayEvents.length > visibleCount;
  const remainingCount = hasMore ? allDayEvents.length - visibleCount : 0;

  /**
   * Gestionnaire pour la création d'un nouvel événement
   * Crée un événement avec une heure de début par défaut
   */
  const handleCreateEvent = () => {
    const startTime = new Date(day);
    startTime.setHours(DefaultStartHour, 0, 0);
    onEventCreate(startTime);
  };

  return (
<div
  className="group border hover:bg-accent/75
             data-outside-cell:bg-muted/50
             data-outside-cell:text-muted-foreground/60
             data-today:bg-primary/10"
  data-today={isToday(day) || undefined}
  data-outside-cell={!isCurrentMonth || undefined}
>

      <DroppableCell id={cellId} date={day} onClick={handleCreateEvent}>
        {/* Numéro du jour avec style conditionnel pour aujourd'hui */}

{/* <ReusablePopover
  triggerClassName="relative z-20"
  trigger={
    <div
      className="absolute inline-flex size-6 items-center justify-center rounded-full text-sm
                 group-data-[today]:bg-primary/80 group-data-[today]:text-primary-foreground
                 group-data-[outside-cell]:opacity-60 group-data-[outside-cell]:bg-transparent
                 bg-background/40 hover:border cursor-pointer"
    >
      {format(day, "d")}
    </div>
  }
  content={<EventUsers />}
/> */}


        {/* Container des événements avec hauteur minimale responsive */}
        <div
          ref={contentRef}
className="aspect-square "
        >
          {/* Liste des événements visibles */}
          <EventList
            events={allDayEvents}
            day={day}
            onEventClick={onEventClick}
            visibleCount={visibleCount}
            isMounted={isMounted}
          />

          {/* Popover pour les événements supplémentaires */}
          {hasMore && (
            <MoreEventsPopover
              day={day}
              remainingCount={remainingCount}
              allEvents={allEvents}
              onEventClick={onEventClick}
            />
          )}
        </div>
      </DroppableCell>
    </div>
  );
}

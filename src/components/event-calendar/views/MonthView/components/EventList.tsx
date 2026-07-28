import React from "react";
import { format, isSameDay } from "date-fns";
import {
  ScheduleEvent,
  DraggableEvent,
  EventItem,
  sortEvents,
  isAllDayEvent,
} from "@/components/event-calendar";

/**
 * Interface pour les props du composant EventList
 */
interface EventListProps {
  /** Liste des événements à afficher */
  events: ScheduleEvent[];
  /** Date du jour courant */
  day: Date;
  /** Callback pour le clic sur un événement */
  onEventClick: (event: ScheduleEvent, e: React.MouseEvent) => void;
  /** Nombre d'événements visibles (undefined si pas encore calculé) */
  visibleCount: number | undefined;
  /** État de montage du composant */
  isMounted: boolean;
}

/**
 * Composant gérant l'affichage de la liste des événements d'un jour
 *
 * Ce composant gère :
 * - Le tri et l'affichage des événements
 * - La distinction entre événements qui commencent ce jour et ceux qui s'étendent
 * - La gestion de la visibilité (événements cachés en cas d'overflow)
 * - Le rendu différencié pour les événements draggables vs simples
 */
export function EventList({
  events,
  day,
  onEventClick,
  visibleCount,
  isMounted,
}: EventListProps) {
  // Ne pas afficher si le nombre visible n'est pas encore calculé
  if (!visibleCount) return null;

  return (
    <>
      {sortEvents(events).map((event, index) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const isFirstDay = isSameDay(day, eventStart);
        const isLastDay = isSameDay(day, eventEnd);

        // Détermine si l'événement doit être caché
        const isHidden = isMounted && visibleCount && index >= visibleCount;

        // Rendu pour les événements qui ne commencent pas ce jour (événements étendus)
        if (!isFirstDay) {
          return (
            <div
              key={`spanning-${event.id}-${day.toISOString().slice(0, 10)}`}
              className="aria-hidden:hidden"
              aria-hidden={isHidden ? "true" : undefined}
            >
              <EventItem
                onClick={(e) => onEventClick(event, e)}
                event={event}
                view="month"
                isFirstDay={isFirstDay}
                isLastDay={isLastDay}
              >
                {/* Contenu invisible pour maintenir la hauteur */}
                <div className="invisible" aria-hidden={true}>
                  {!isAllDayEvent(event) && (
                    <span>
                      {format(new Date(event.start), "h:mm")}{" "}
                    </span>
                  )}
                  {event.title}
                </div>
              </EventItem>
            </div>
          );
        }

        // Rendu pour les événements qui commencent ce jour (événements draggables)
        return (
          <div
            key={event.id}
            className="aria-hidden:hidden"
            aria-hidden={isHidden ? "true" : undefined}
          >
            <DraggableEvent
              event={event}
              view="month"
              onClick={(e) => onEventClick(event, e)}
              isFirstDay={isFirstDay}
              isLastDay={isLastDay}
            />
          </div>
        );
      })}
    </>
  );
}

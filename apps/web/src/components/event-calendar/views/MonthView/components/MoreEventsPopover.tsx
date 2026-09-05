import React from "react";
import { format, isSameDay } from "date-fns";
import {
  ScheduleEvent,
  EventItem,
  sortEvents,
  EventHeight,
} from "@/components/event-calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Interface pour les props du composant MoreEventsPopover
 */
interface MoreEventsPopoverProps {
  /** Date du jour */
  day: Date;
  /** Nombre d'événements restants non affichés */
  remainingCount: number;
  /** Liste complète des événements du jour */
  allEvents: ScheduleEvent[];
  /** Callback pour le clic sur un événement */
  onEventClick: (event: ScheduleEvent, e: React.MouseEvent) => void;
}

/**
 * Composant popover affichant les événements supplémentaires
 * 
 * Ce composant gère :
 * - L'affichage d'un bouton "+ X more" quand il y a trop d'événements
 * - Un popover contenant tous les événements du jour
 * - Le formatage et l'affichage des événements dans le popover
 * - La prévention de la propagation des clics
 */
export function MoreEventsPopover({
  day,
  remainingCount,
  allEvents,
  onEventClick,
}: MoreEventsPopoverProps) {
  /**
   * Empêche la propagation du clic sur le bouton pour éviter
   * d'activer les handlers de la cellule parent
   */
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <button
          className="mt-[var(--event-gap)] flex h-[var(--event-height)] w-full select-none items-center overflow-hidden px-1 text-left text-[10px] text-muted-foreground outline-none backdrop-blur-md transition hover:bg-muted/50 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:px-2 sm:text-xs"
          onClick={handleButtonClick}
        >
          <span>
            + {remainingCount}{" "}
            <span className="max-sm:sr-only">more</span>
          </span>
        </button>
      </PopoverTrigger>
      
      <PopoverContent
        align="center"
        className="max-w-52 p-3"
        style={
          {
            "--event-height": `${EventHeight}px`,
          } as React.CSSProperties
        }
      >
        <div className="space-y-2">
          {/* En-tête avec la date formatée */}
          <div className="text-sm font-medium">
            {format(day, "EEE d")}
          </div>
          
          {/* Liste de tous les événements du jour */}
          <div className="space-y-1">
            {sortEvents(allEvents).map((event) => {
              const eventStart = new Date(event.start);
              const eventEnd = new Date(event.end);
              const isFirstDay = isSameDay(day, eventStart);
              const isLastDay = isSameDay(day, eventEnd);

              return (
                <EventItem
                  key={event.id}
                  onClick={(e: any) => onEventClick(event, e)}
                  event={event}
                  view="month"
                  isFirstDay={isFirstDay}
                  isLastDay={isLastDay}
                />
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

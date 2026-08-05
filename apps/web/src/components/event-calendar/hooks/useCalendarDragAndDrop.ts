import { useCallback } from "react";
import { ScheduleEvent } from "../types";

/**
 * Hook personnalisé pour gérer le glisser-déposer dans le calendrier
 * @param onEventUpdate - Callback appelé lors de la mise à jour d'un événement
 * @returns Objet contenant les fonctions de gestion du glisser-déposer
 */
export const useCalendarDragAndDrop = (
  onEventUpdate?: (event: ScheduleEvent) => void
) => {
  /**
   * Gère le déplacement d'un événement
   */
  const handleEventDrop = useCallback(
    (event: ScheduleEvent, start: Date, end: Date) => {
      const duration = end.getTime() - start.getTime();
      const updatedEvent = {
        ...event,
        start,
        end: new Date(start.getTime() + duration),
      };
      onEventUpdate?.(updatedEvent);
    },
    [onEventUpdate]
  );

  /**
   * Gère le redimensionnement d'un événement
   */
  const handleEventResize = useCallback(
    (event: ScheduleEvent, start: Date, end: Date) => {
      const updatedEvent = {
        ...event,
        start,
        end,
      };
      onEventUpdate?.(updatedEvent);
    },
    [onEventUpdate]
  );

  return {
    handleEventDrop,
    handleEventResize,
  };
}; 
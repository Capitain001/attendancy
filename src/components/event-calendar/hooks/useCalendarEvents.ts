import { useCallback, useState } from "react";
import { ScheduleEvent, ScheduleUpdateSource } from "../types";

/**
 * Hook de gestion de l'état UI des événements du calendrier.
 *
 * NB : ce hook ne produit AUCUN feedback (toast). Le calendrier est un
 * composant de présentation ; l'issue réelle d'une mutation (succès, conflit,
 * annulation) n'est connue que du consommateur, qui en porte donc le feedback.
 * Le contrat `ok === false` sert uniquement à piloter la fermeture du dialog.
 *
 * @param onEventAdd - Callback ajout (retourne false pour échec/annulation)
 * @param onEventUpdate - Callback mise à jour
 * @param onEventDelete - Callback suppression
 */
export const useCalendarEvents = (
  onEventAdd?: (event: ScheduleEvent) => void | Promise<boolean | void>,
  onEventUpdate?: (
    event: ScheduleEvent,
    source: ScheduleUpdateSource
  ) => void | Promise<boolean | void>,
  onEventDelete?: (eventId: string) => void | Promise<boolean | void>
) => {
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  /** Sélectionne un événement pour l'édition */
  const handleEventSelect = useCallback((event: ScheduleEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  }, []);

  /** Crée un nouvel événement à partir d'une date de début */
  const handleEventCreate = useCallback((startTime: Date) => {
    const minutes = startTime.getMinutes();
    const remainder = minutes % 15;
    const adjustedTime = new Date(startTime);

    // Ajustement au quart d'heure le plus proche
    if (remainder !== 0) {
      adjustedTime.setMinutes(
        minutes + (remainder < 7.5 ? -remainder : 15 - remainder)
      );
      adjustedTime.setSeconds(0);
      adjustedTime.setMilliseconds(0);
    }

    const newEvent: ScheduleEvent = {
      id: "",
      title: "",
      description: "",
      start: adjustedTime,
      end: new Date(adjustedTime.getTime() + 60 * 60 * 1000), // +1 heure
      meta: {
        ruleId: "",
        courseId: "",
        teacherId: "",
        roomId: "",
        status: "PENDING",
        confirmed: false,
      },
    };
    setSelectedEvent(newEvent);
    setIsEventDialogOpen(true);
  }, []);

  /** Sauvegarde un événement (création ou mise à jour) depuis le dialog */
  const handleEventSave = useCallback(
    async (event: ScheduleEvent) => {
      // Update via le formulaire d'édition (source "form") ; sinon création.
      const ok = await Promise.resolve(
        event.id ? onEventUpdate?.(event, "form") : onEventAdd?.(event)
      );
      if (ok === false) return; // échec/annulation -> dialog reste ouvert
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
    },
    [onEventAdd, onEventUpdate]
  );

  /** Supprime un événement depuis le dialog */
  const handleEventDelete = useCallback(
    async (eventId: string) => {
      const ok = await Promise.resolve(onEventDelete?.(eventId));
      if (ok === false) return;
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
    },
    [onEventDelete]
  );

  /** Met à jour un événement (glisser-déposer → source "dnd") */
  const handleEventUpdate = useCallback(
    async (updatedEvent: ScheduleEvent) => {
      await Promise.resolve(onEventUpdate?.(updatedEvent, "dnd"));
    },
    [onEventUpdate]
  );

  return {
    selectedEvent,
    isEventDialogOpen,
    setIsEventDialogOpen,
    setSelectedEvent,
    handleEventSelect,
    handleEventCreate,
    handleEventSave,
    handleEventDelete,
    handleEventUpdate,
  };
};

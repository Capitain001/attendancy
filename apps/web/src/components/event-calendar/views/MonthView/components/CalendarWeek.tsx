import React from "react";
import { ScheduleEvent } from "@/components/event-calendar";
import { CalendarDay } from "./CalendarDay";

/**
 * Interface pour les props du composant CalendarWeek
 */
interface CalendarWeekProps {
  /** Tableau des jours de la semaine */
  week: Date[];
  /** Index de la semaine dans le mois */
  weekIndex: number;
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
  /** Référence pour le calcul de visibilité (première cellule uniquement) */
  contentRef: React.RefObject<HTMLDivElement> | null;
}

/**
 * Composant représentant une semaine complète dans le calendrier mensuel
 * 
 * Ce composant gère :
 * - L'affichage d'une rangée de 7 jours
 * - La transmission des props nécessaires à chaque jour
 * - La gestion des bordures entre les semaines
 */
export function CalendarWeek({
  week,
  weekIndex,
  currentDate,
  events,
  onEventClick,
  onEventCreate,
  isMounted,
  getVisibleEventCount,
  contentRef,
}: CalendarWeekProps) {
  return (
    <div
      className="grid grid-cols-7 "
    >
      {week.map((day, dayIndex) => {
        // Vérification de sécurité pour les jours non définis
        if (!day) return null;

        // Détermine si cette cellule est la référence pour le calcul de visibilité
        const isReferenceCell = weekIndex === 0 && dayIndex === 0;

        return (
          <CalendarDay
            key={day.toString()}
            day={day}
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
            onEventCreate={onEventCreate}
            isMounted={isMounted}
            getVisibleEventCount={getVisibleEventCount}
            contentRef={isReferenceCell ? contentRef : null}
          />
        );
      })}
    </div>
  );
}
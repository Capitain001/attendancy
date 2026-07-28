import { ScheduleEvent } from "@/components/event-calendar";

/**
 * Interface commune pour les props liées aux événements
 * Utilisée par plusieurs composants pour maintenir la cohérence
 */
export interface EventHandlers {
  /** Callback appelé lors du clic sur un événement */
  onEventClick: (event: ScheduleEvent, e: React.MouseEvent) => void;
  /** Callback appelé lors de la création d'un nouvel événement */
  onEventCreate: (startTime: Date) => void;
}

/**
 * Interface pour les props de visibilité des événements
 * Utilisée pour gérer l'affichage conditionnel des événements
 */
export interface EventVisibilityProps {
  /** État indiquant si le composant est monté (pour l'hydratation SSR) */
  isMounted: boolean;
  /** Fonction retournant le nombre d'événements visibles selon l'espace disponible */
  getVisibleEventCount: (eventCount: number) => number | undefined;
}

/**
 * Interface pour les données d'un jour dans le calendrier
 * Regroupe toutes les informations nécessaires pour afficher un jour
 */
export interface DayData {
  /** Date du jour */
  day: Date;
  /** Date courante du calendrier (pour déterminer le mois actuel) */
  currentDate: Date;
  /** Liste des événements à afficher */
  events: ScheduleEvent[];
}

/**
 * Type union pour les vues de calendrier supportées
 * Extensible pour d'autres vues (semaine, jour, etc.)
 */
export type CalendarView = "month" | "week" | "day";

/**
 * Interface pour les dimensions et espacement des événements
 * Utilisée pour maintenir la cohérence visuelle
 */
export interface EventLayoutConfig {
  /** Hauteur d'un événement en pixels */
  eventHeight: number;
  /** Espacement entre les événements en pixels */
  eventGap: number;
}

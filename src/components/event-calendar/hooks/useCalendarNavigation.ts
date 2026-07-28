import { useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  subMonths,
  subWeeks,
} from "date-fns";
import { CalendarView } from "../types";
import { AgendaDaysToShow } from "../constants";

/**
 * Hook personnalisé pour gérer la navigation dans le calendrier
 * @param view - La vue actuelle du calendrier (mois, semaine, jour, agenda)
 * @param initialDate - La date initiale (par défaut: date actuelle)
 * @returns Objet contenant la date courante et les fonctions de navigation
 */
export const useCalendarNavigation = (
  view: CalendarView,
  initialDate = new Date()
) => {
  const [currentDate, setCurrentDate] = useState(initialDate);

  const navigate = {
    /**
     * Navigation vers la période précédente
     */
    previous: () => {
      switch (view) {
        case "month":
          setCurrentDate(subMonths(currentDate, 1));
          break;
        case "week":
          setCurrentDate(subWeeks(currentDate, 1));
          break;
        case "day":
          setCurrentDate(addDays(currentDate, -1));
          break;
        case "agenda":
          setCurrentDate(addDays(currentDate, -AgendaDaysToShow));
          break;
      }
    },

    /**
     * Navigation vers la période suivante
     */
    next: () => {
      switch (view) {
        case "month":
          setCurrentDate(addMonths(currentDate, 1));
          break;
        case "week":
          setCurrentDate(addWeeks(currentDate, 1));
          break;
        case "day":
          setCurrentDate(addDays(currentDate, 1));
          break;
        case "agenda":
          setCurrentDate(addDays(currentDate, AgendaDaysToShow));
          break;
      }
    },

    /**
     * Retour à la date du jour
     */
    today: () => setCurrentDate(new Date()),

    /**
     * Navigation vers une date spécifique
     */
    toDate: (date: Date) => setCurrentDate(date),
  };

  return { currentDate, setCurrentDate, navigate };
};

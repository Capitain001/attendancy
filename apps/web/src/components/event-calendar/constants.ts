import type { Day } from "date-fns";
import { fr } from "date-fns/locale";

// Jour de début de semaine partagé par toutes les vues — 0=dimanche, 1=lundi
export const WEEK_STARTS_ON: Day = 1;

// Locale unique du calendrier
export const CALENDAR_LOCALE = fr;

export const EventHeight = 24;

// Vertical gap between events in pixels - controls spacing in month view
export const EventGap = 4;

// Height of hour cells in week and day views - controls the scale of time display
export const WeekCellsHeight = 64;

// Number of days to show in the agenda view
export const AgendaDaysToShow = 30;

// Start and end hours for the week and day views
export const StartHour = 0;
export const EndHour = 24;

// Default start and end times
export const DefaultStartHour = 9; // 9 AM
export const DefaultEndHour = 10; // 10 AM

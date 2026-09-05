/**
 * Point d'entrée principal pour le module MonthView
 * 
 * Ce fichier exporte tous les composants, hooks, types et utilitaires
 * nécessaires à l'utilisation du calendrier mensuel.
 */

// Composant principal
export { MonthView } from './month-view';

// Sous-composants
export { WeekdaysHeader } from './components/WeekdaysHeader';
export { CalendarWeek } from './components/CalendarWeek';
export { CalendarDay } from './components/CalendarDay';
export { EventList } from './components/EventList';
export { MoreEventsPopover } from './components/MoreEventsPopover';

// Hooks personnalisés
export {
  useMonthViewData,
  useMountedState,
  useEventHandlers,
  useDayEventVisibility,
  useEventCreation,
} from './hooks/month-view-hooks';

// Types et interfaces
export type {
  EventHandlers,
  EventVisibilityProps,
  DayData,
  CalendarView,
  EventLayoutConfig,
} from './types/month-view-types';

// Utilitaires
export {
  getMonthViewDays,
  getWeekdayNames,
  groupDaysIntoWeeks,
  getCellId,
  getEventVisibilityStats,
  isDayInCurrentMonth,
  createDefaultEventStart,
  getDayClasses,
} from './utils/month-view-utils';

// Ré-exports des dépendances communes pour faciliter l'importation
export type { ScheduleEvent } from '@/components/event-calendar';

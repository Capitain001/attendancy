"use client";

// Component exports
export { AgendaView } from "./views/agenda-view";
export { DayView } from "./views/DayView/day-view";
export { DraggableEvent } from "./draggable-event";
export { DroppableCell } from "./droppable-cell";
export { EventDialog } from "./components/event-dialog";
export { EventItem } from "./components/event-item";
export { EventsPopup } from "./events-popup";
export { EventCalendar } from "./event-calendar";
export type { EventDialogRendererProps } from "./event-calendar";
export { MonthView } from "./views/MonthView/month-view";
export { WeekView } from "./views/WeekView/week-view";
export { CalendarDndProvider, useCalendarDnd } from "./context/calendar-dnd-context";

// Constants and utility exports
export * from "./constants";
export * from "./utils";

// Hook exports
export * from "@/hooks/use-current-time-indicator";
export * from "@/hooks/use-event-visibility";
export { useCalendarNavigation } from "./hooks/useCalendarNavigation";
export { useCalendarEvents } from "./hooks/useCalendarEvents";
export { useCalendarDragAndDrop } from "./hooks/useCalendarDragAndDrop";

// Type exports
export type { ScheduleEvent, CalendarView, EventColor, ScheduleUpdateSource } from "./types";

// Composants
export { CalendarHeader } from "./components/CalendarHeader";

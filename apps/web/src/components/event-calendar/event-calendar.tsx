"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScheduleEvent, CalendarView, ScheduleUpdateSource } from "./types";
import { CalendarDndProvider } from "./context/calendar-dnd-context";
import { useCalendarNavigation } from "./hooks/useCalendarNavigation";
import { useCalendarEvents } from "./hooks/useCalendarEvents";

// Composants
import { CalendarHeader } from "./components/CalendarHeader";
import { EventDialog } from "./components/event-dialog";
import { CollapseItem } from "@/components/layout/CollapseItem";

// Vues
import { MonthView } from "./views/MonthView/month-view";

import { DayView } from "./views/DayView/day-view";
import { AgendaView } from "./views/agenda-view";

// Styles
import { EventHeight, EventGap, WeekCellsHeight } from "./constants";
import { WeekView } from "./views/WeekView/week-view";

export type EventDialogRendererProps = {
  event: ScheduleEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ScheduleEvent) => void | Promise<boolean | void>;
  onDelete: (eventId: string) => void | Promise<boolean | void>;
};

interface EventCalendarProps {
  events?: ScheduleEvent[];
  onEventAdd?: (event: ScheduleEvent) => void | Promise<boolean | void>;
  onEventUpdate?: (
    event: ScheduleEvent,
    source: ScheduleUpdateSource
  ) => void | Promise<boolean | void>;
  onEventDelete?: (eventId: string) => void | Promise<boolean | void>;
  /** Remplace le dialogue générique (ex. assignation cours / direction). */
  renderEventDialog?: (props: EventDialogRendererProps) => ReactNode;
  className?: string;
  initialView?: CalendarView;
  href?: string;
  title?: string;
  /** Lecture seule : désactive le drag & drop (ex. espace étudiant). */
  readOnly?: boolean;
}

/**
 * Composant principal du calendrier
 * Gère l'affichage et la logique du calendrier avec ses différentes vues
 */
export function EventCalendar({
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  renderEventDialog,
  className,
  initialView = "month",
  href,
  title,
  readOnly = false,
}: EventCalendarProps) {
  // État local
  const [view, setView] = useState<CalendarView>(initialView);

  // Stable sur la durée de vie du composant (évite un new Date() par render).
  const today = useMemo(() => new Date(), []);

  // Hooks personnalisés
  const { currentDate, navigate } = useCalendarNavigation(view);
  const {
    selectedEvent,
    isEventDialogOpen,
    setIsEventDialogOpen,
    setSelectedEvent,
    handleEventSelect,
    handleEventCreate,
    handleEventSave,
    handleEventDelete,
    handleEventUpdate,
  } = useCalendarEvents(onEventAdd, onEventUpdate, onEventDelete);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isEventDialogOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      const viewMap: Record<string, CalendarView> = {
        m: "month",
        w: "week",
        d: "day",
        a: "agenda",
      };

      const newView = viewMap[e.key.toLowerCase()];
      if (newView) setView(newView);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEventDialogOpen]);

  // Gestionnaire de changement de vue
  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
  };

  // Gestionnaire de changement de date
  const handleDateChange = (date: Date) => {
    navigate.toDate(date);
  };

  // Rendu du composant
  return (
    <div
      className={cn(
        // Hauteur DÉFINIE (pas de flex-1 ici : flex-1 mettrait flex-basis:0% et,
        // dans un parent à hauteur indéfinie, rendrait la hauteur indéterminée →
        // les conteneurs internes overflow-y-auto cesseraient de scroller).
        "flex h-[calc(100dvh-var(--calendar-shell-offset,0px))] min-h-0 flex-col overflow-hidden ",
        className
      )}
      style={
        {
          "--event-height": `${EventHeight}px`,
          "--event-gap": `${EventGap}px`,
          "--week-cells-height": `${WeekCellsHeight}px`,
        } as React.CSSProperties
      }
    >
      <CalendarDndProvider onEventUpdate={handleEventUpdate} readOnly={readOnly}>
        <div className="flex min-h-0 flex-1  flex-col overflow-hidden ">
          <div className="sticky top-0 z-40 shrink-0  bg-background/95 backdrop-blur">
            <CollapseItem defaultOpen={true}>
              <CalendarHeader
                view={view}
                setView={setView}
                selectedDay={currentDate}
                firstDayCurrentMonth={currentDate}
                previousPeriod={navigate.previous}
                nextPeriod={navigate.next}
                goToToday={navigate.today}
                today={today}
                href={href || "#"}
                title={title}
              />
            </CollapseItem>
          </div>

          <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {/* Vues du calendrier */}
            {view === "month" && (
              <MonthView
                currentDate={currentDate}
                events={events}
                onEventSelect={handleEventSelect}
                onEventCreate={handleEventCreate}
              />
            )}
            {view === "week" && (
              <WeekView
                currentDate={currentDate}
                events={events}
                onEventSelect={handleEventSelect}
                onEventCreate={handleEventCreate}
                onDateChange={handleDateChange}
                onViewChange={handleViewChange}
              />
            )}
            {view === "day" && (
              <DayView
                currentDate={currentDate}
                events={events}
                onEventSelect={handleEventSelect}
                onEventCreate={handleEventCreate}
              />
            )}
            {view === "agenda" && (
              <AgendaView
                currentDate={currentDate}
                events={events}
                onEventSelect={handleEventSelect}
              />
            )}
          </div>
        </div>

        {/* Dialogue d'édition d'événement */}
        {renderEventDialog ? (
          renderEventDialog({
            event: selectedEvent,
            isOpen: isEventDialogOpen,
            onClose: () => {
              setIsEventDialogOpen(false);
              setSelectedEvent(null);
            },
            onSave: handleEventSave,
            onDelete: handleEventDelete,
          })
        ) : (
          <EventDialog
            event={selectedEvent}
            isOpen={isEventDialogOpen}
            onClose={() => {
              setIsEventDialogOpen(false);
              setSelectedEvent(null);
            }}
            onSave={handleEventSave}
            onDelete={handleEventDelete}
          />
        )}
      </CalendarDndProvider>
    </div>
  );
}

"use client";

import { memo, useMemo } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { differenceInMinutes, format, getMinutes, isPast } from "date-fns";

import {
  getBorderRadiusClasses,
  getEventColorClasses,
  isAllDayEvent,
  type ScheduleEvent,
} from "@/components/event-calendar";
import { cn, formatTime } from "@/lib/utils";

const formatTimeWithOptionalMinutes = (date: Date) => {
  return format(date, getMinutes(date) === 0 ? "ha" : "h:mma").toLowerCase();
};

interface EventWrapperProps {
  event: ScheduleEvent;
  isFirstDay?: boolean;
  isLastDay?: boolean;
  isDragging?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children: React.ReactNode;
  currentTime?: Date;
  dndListeners?: SyntheticListenerMap;
  dndAttributes?: DraggableAttributes;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

// Shared wrapper component for event styling
function EventWrapper({
  event,
  isFirstDay = true,
  isLastDay = true,
  isDragging,
  onClick,
  className,
  children,
  currentTime,
  dndListeners,
  dndAttributes,
  onMouseDown,
  onTouchStart,
}: EventWrapperProps) {
  const displayEnd = currentTime
    ? new Date(
        new Date(currentTime).getTime() +
          (new Date(event.end).getTime() - new Date(event.start).getTime()),
      )
    : new Date(event.end);

  const isEventInPast = isPast(displayEnd);

  // Style de hachures injecté si l'événement est passé
  const skewStyle = isEventInPast
    ? {
        backgroundImage:
          "repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(128,128,128,0.12) 5px, rgba(128,128,128,0.12) 10px)",
      }
    : undefined;

  return (
    <button
      className={cn(
        "data-dragging:cursor-grabbing data-dragging:shadow-lg data-past-event:line-through flex size-full select-none overflow-hidden px-1 text-left font-medium outline-none backdrop-blur-md transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:px-2",
        getEventColorClasses(event.color),
        getBorderRadiusClasses(isFirstDay, isLastDay),
        className,
      )}
      style={skewStyle} // Application de l'effet
      data-dragging={isDragging || undefined}
      data-past-event={isEventInPast || undefined}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      {...dndListeners}
      {...dndAttributes}
    >
      {children}
    </button>
  );
}

interface EventItemProps {
  event: ScheduleEvent;
  view: "month" | "week" | "day" | "agenda";
  isDragging?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  showTime?: boolean;
  currentTime?: Date;
  isFirstDay?: boolean;
  isLastDay?: boolean;
  children?: React.ReactNode;
  className?: string;
  dndListeners?: SyntheticListenerMap;
  dndAttributes?: DraggableAttributes;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

function EventItemComponent({
  event,
  view,
  isDragging,
  onClick,
  showTime,
  currentTime,
  isFirstDay = true,
  isLastDay = true,
  children,
  className,
  dndListeners,
  dndAttributes,
  onMouseDown,
  onTouchStart,
}: EventItemProps) {
  const eventColor = event.color;

  const displayStart = useMemo(() => {
    return currentTime || new Date(event.start);
  }, [currentTime, event.start]);

  const displayEnd = useMemo(() => {
    return currentTime
      ? new Date(
          new Date(currentTime).getTime() +
            (new Date(event.end).getTime() - new Date(event.start).getTime()),
        )
      : new Date(event.end);
  }, [currentTime, event.start, event.end]);

  const durationMinutes = useMemo(() => {
    return differenceInMinutes(displayEnd, displayStart);
  }, [displayStart, displayEnd]);

  const getEventTime = () => {
    if (isAllDayEvent(event)) return "All day";
    if (durationMinutes < 45) {
      return formatTime(displayStart);
    }
    return `${formatTime(displayStart)} - ${formatTime(displayEnd)}`;
  };

  if (view === "month") {
    return (
      <EventWrapper
        event={event}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        isDragging={isDragging}
        onClick={onClick}
        className={cn(
          "mt-(--event-gap) h-[(--event-height)] items-center text-[10px] sm:text-xs",
          className,
        )}
        currentTime={currentTime}
        dndListeners={dndListeners}
        dndAttributes={dndAttributes}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {children || (
          <span className="truncate">
            {!isAllDayEvent(event) && (
              <span className="truncate font-normal opacity-70 sm:text-[11px]">
                {formatTime(displayStart)}{" "}
              </span>
            )}
            {event.title}
          </span>
        )}
      </EventWrapper>
    );
  }

  if (view === "week" || view === "day") {
    return (
      <EventWrapper
        event={event}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        isDragging={isDragging}
        onClick={onClick}
        className={cn(
          "py-1",
          durationMinutes < 45 ? "items-center" : "flex-col",
          view === "week" ? "text-[10px] sm:text-xs" : "text-xs",
          className,
        )}
        currentTime={currentTime}
        dndListeners={dndListeners}
        dndAttributes={dndAttributes}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {durationMinutes < 45 ? (
          <div className="truncate">
            {event.title}{" "}
            {showTime && (
              <span className="opacity-70">
                {formatTime(displayStart)}
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="truncate font-medium">{event.title}</div>
            {showTime && (
              <div className="truncate font-normal opacity-70 sm:text-[11px]">
                {getEventTime()}
              </div>
            )}
          </>
        )}
      </EventWrapper>
    );
  }

  // Agenda view - Application directe du style également
  const isAgendaPast = isPast(new Date(event.end));
  const agendaSkewStyle = isAgendaPast
    ? {
        backgroundImage:
          "repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(128,128,128,0.12) 5px, rgba(128,128,128,0.12) 10px)",
      }
    : undefined;

  return (
    <button
      className={cn(
        "data-past-event:line-through data-past-event:opacity-90 flex w-full flex-col gap-1 rounded p-2 text-left outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        getEventColorClasses(eventColor),
        className,
      )}
      style={agendaSkewStyle} // Application de l'effet pour l'agenda
      data-past-event={isAgendaPast || undefined}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      {...dndListeners}
      {...dndAttributes}
    >
      <div className="text-sm font-medium">{event.title}</div>
      <div className="text-xs opacity-70">
        {isAllDayEvent(event) ? (
          <span>All day</span>
        ) : (
          <span className="uppercase">
            {formatTime(displayStart)} - {formatTime(displayEnd)}
          </span>
        )}
        {event.location && (
          <>
            <span className="px-1 opacity-35"> · </span>
            <span>{event.location}</span>
          </>
        )}
      </div>
      {event.description && (
        <div className="my-1 text-xs opacity-90">{event.description}</div>
      )}
    </button>
  );
}

export const EventItem = memo(EventItemComponent, (prev, next) => {
  const prevCurrent = prev.currentTime?.getTime() ?? 0;
  const nextCurrent = next.currentTime?.getTime() ?? 0;

  return (
    prev.event.id === next.event.id &&
    prev.event.start === next.event.start &&
    prev.event.end === next.event.end &&
    prev.event.title === next.event.title &&
    prev.event.description === next.event.description &&
    prev.event.location === next.event.location &&
    prev.event.color === next.event.color &&
    prev.view === next.view &&
    prev.isDragging === next.isDragging &&
    prev.showTime === next.showTime &&
    prevCurrent === nextCurrent &&
    prev.isFirstDay === next.isFirstDay &&
    prev.isLastDay === next.isLastDay &&
    prev.className === next.className &&
    prev.onClick === next.onClick &&
    prev.onMouseDown === next.onMouseDown &&
    prev.onTouchStart === next.onTouchStart &&
    prev.dndListeners === next.dndListeners &&
    prev.dndAttributes === next.dndAttributes &&
    prev.children === next.children
  );
});

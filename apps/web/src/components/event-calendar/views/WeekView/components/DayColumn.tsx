import { isToday, getHours, getDay, endOfDay } from "date-fns";
import { ScheduleEvent } from "@/components/event-calendar/types";
import { DraggableEvent } from "@/components/event-calendar/draggable-event";
import { DroppableCell } from "@/components/event-calendar/droppable-cell";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import { cn } from "@/lib/utils";
import { isSlotElapsed } from "@/services/planning/policy";

interface DayColumnProps {
  day: Date;
  dayIndex: number;
  hours: Date[];
  positionedEvents: Array<{
    event: ScheduleEvent;
    top: number;
    height: number;
    left: number;
    width: number;
    zIndex: number;
  }>;
  currentTimeVisible?: boolean;
  currentTimePosition?: number;
  onEventClick: (event: ScheduleEvent, e: React.MouseEvent) => void;
  onEventCreate: (time: Date) => void;
}

/**
 * Composant pour afficher une colonne de jour
 * Gère l'affichage des événements, des cellules de temps et de l'indicateur de temps actuel
 * Version harmonisée avec WeekView-test pour une meilleure gestion des positions d'événements
 */
export function DayColumn({
  day,
  dayIndex,
  hours,
  positionedEvents,
  currentTimeVisible,
  currentTimePosition,
  onEventClick,
  onEventCreate,
}: DayColumnProps) {
  const isWeekend = [0, 6].includes(getDay(day)); // 0 = dimanche, 6 = samedi
  
  // Un jour est complètement "passé" si la fin de la journée est passée
  const isElapsed = isSlotElapsed({ start: day, end: endOfDay(day) });

  return (
    <div
      className={cn(
        "relative grid auto-cols-fr border-r border-border/70 last:border-r-0",
        isWeekend && "bg-muted/50",
        isElapsed && "grayscale bg-muted/20"
      )}
      data-today={isToday(day) || undefined}
    >
     
      {/* Événements positionnés */}
      {(positionedEvents ?? []).map((positionedEvent) => (
        <div
          key={positionedEvent.event.id}
          className="absolute z-10 px-0.5"
          style={{
            top: `${positionedEvent.top}px`,
            height: `${positionedEvent.height}px`,
            left: `${positionedEvent.left * 100}%`,
            width: `${positionedEvent.width * 100}%`,
            zIndex: positionedEvent.zIndex,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="size-full">
            <DraggableEvent
              event={positionedEvent.event}
              view="week"
              onClick={(e) => onEventClick(positionedEvent.event, e)}
              showTime
              height={positionedEvent.height}
            />
          </div>
        </div>
      ))}

      {/* Indicateur de temps actuel */}
      {currentTimeVisible && isToday(day) && (
        <CurrentTimeIndicator position={currentTimePosition || 0} />
      )}

      {/* Grille horaire */}
      {hours.map((hour) => {
        const hourValue = getHours(hour);
        return (
          <div
            key={hour.toString()}
            className="relative min-h-[var(--week-cells-height)] last:border-b-0 border-y border-dashed border-0.5 border-gray-300/40"
          >
         
            {[0, 1, 2, 3].map((quarter) => {
              const quarterHourTime = hourValue + quarter * 0.25;
              const startTime = new Date(day);
              startTime.setHours(hourValue);
              startTime.setMinutes(quarter * 15);

              return (
                <div key={`${hour.toString()}-${quarter}`}>
                  <DroppableCell
                    id={`week-cell-${day.toISOString()}-${quarterHourTime}`}
                    date={day}
                    time={quarterHourTime}
                    className={cn(
                    "absolute h-[calc(var(--week-cells-height)/4)] w-full",
                    quarter === 0 && "top-0",
                    quarter === 1 && "top-[calc(var(--week-cells-height)/4)]",
                    quarter === 2 && "top-[calc(var(--week-cells-height)/4*2)]",
                    quarter === 3 && "top-[calc(var(--week-cells-height)/4*3)]"
                  )}
                    onClick={() => onEventCreate(startTime)}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

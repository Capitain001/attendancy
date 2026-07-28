"use client";

import * as React from "react";
import {
  format,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface MiniCalendarProps {
  pinnedDates?: Date[];
  onDateSelect?: (date: Date) => void;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  pinnedDates = [],
  onDateSelect,
}) => {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = React.useState<Date>(new Date());

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 0 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 0 }),
  });

  const isPinned = (day: Date) =>
    pinnedDates.some((d) => isSameDay(d, day));

  const handleSelect = (day: Date) => {
    if (!isPinned(day)) return;
    setSelectedDate(day);
    onDateSelect?.(day);
  };

  return (
    <div className="w-full rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-sm font-medium">
          {format(currentWeek, "MMMM yyyy")}
        </h2>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 px-4 text-center text-xs font-medium text-muted-foreground">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2 p-4 pt-3">
        {weekDays.map((day, index) => {
          const selected = isSameDay(day, selectedDate);
          const pinned = isPinned(day);
          const showIndicator = pinned && !selected;

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleSelect(day)}
              disabled={!pinned}
              className={cn(
                "relative h-10 w-8 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
         
                selected &&
                  "bg-primary text-primary-foreground shadow-md scale-105",
                !selected &&
                  pinned &&
                  "bg-secondary/50 text-foreground hover:bg-secondary",
                !pinned &&
                  "text-muted-foreground/40",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 20}ms` }}
            >
              {format(day, "d")}

              {showIndicator && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

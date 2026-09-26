"use client";

import { useCallback, useMemo, useState } from "react";
import { startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

import {
  Calendar,
  type DayDecoration,
} from "@/components/ui/custom/calendar";
import type { GetSchedulesDto } from "@/services/schedule";
import { TeacherPlanningDrawer } from "./ui/TeacherPlanningDrawer";

type ScheduleItem = GetSchedulesDto[number];

function dayKey(date: Date) {
  return startOfDay(date).toISOString();
}

export function TeacherPlanning({
  schedules,
}: {
  schedules: GetSchedulesDto;
}) {
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfDay(new Date())
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const schedulesByDay = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();

    for (const schedule of schedules) {
      const key = dayKey(new Date(schedule.startTime));
      const list = map.get(key) ?? [];

      list.push(schedule);
      map.set(key, list);
    }

    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    }

    return map;
  }, [schedules]);

  const selectedDaySchedules = useMemo(
    () => schedulesByDay.get(dayKey(selectedDate)) ?? [],
    [schedulesByDay, selectedDate]
  );

  const dayDecoration = useCallback(
    (date: Date): DayDecoration | undefined => {
      const daySchedules = schedulesByDay.get(dayKey(date));

      if (!daySchedules?.length) return undefined;

      const hasPending = daySchedules.some(
        (schedule) => schedule.status === "PENDING"
      );

      return {
        fillClassName: "bg-primary/10",
        ringClassName: hasPending ? "ring-2 ring-amber-400" : undefined,
      };
    },
    [schedulesByDay]
  );

  const dayFooter = useCallback(
    (date: Date) => {
      const count = schedulesByDay.get(dayKey(date))?.length ?? 0;

      return count || null;
    },
    [schedulesByDay]
  );

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(startOfDay(date));
    setIsDrawerOpen(true);
  };

  return (
    <div className="w-full h-full flex-1 flex">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleSelectDate}
        dayDecoration={dayDecoration}
        dayFooter={dayFooter}
        locale={fr}
        todayLabel="Auj."
        classNames={{ root: "w-full " }}
        className="mx-auto p-2 gap-3 h-[580px]"
      />

      <TeacherPlanningDrawer
      className="max-h-[380px]"
        selectedDate={selectedDate}
        schedules={selectedDaySchedules}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}
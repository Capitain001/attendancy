// src/components/teacher/planning/TeacherPlanning.tsx
"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns/format";
import { startOfDay } from "date-fns/startOfDay";
import { fr } from "date-fns/locale";

import {
  Calendar,
  type DayDecoration,
} from "@/components/ui/custom/calendar";
import { usePlanningMonth } from "@/hooks/data/planning/use-planning-month";
import { useScheduleDays } from "@/hooks/data/planning/useScheduleDays";
import { useTeacherDaySchedules } from "@/hooks/data/planning/useTeacherDaySchedules";
import { TeacherPlanningDrawer } from "./ui/TeacherPlanningDrawer";

// Indicateur visuel des jours ayant au moins une séance — isolé de la logique
// métier (le composant ne fait que décider *si* un jour est marqué).
const HAS_SCHEDULE_DECORATION: DayDecoration = {
  fillClassName: "bg-primary/10",
  ringClassName: "ring-2 ring-primary/80",
};

const HAS_SCHEDULE_FOOTER = "•";

export function TeacherPlanning({ teacherId }: { teacherId: string }) {
  const [visibleMonth, setVisibleMonth] = usePlanningMonth();
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfDay(new Date())
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Jours du mois visible (avec prefetch des mois adjacents) — piloté par l'URL.
  const scheduleDays = useScheduleDays({
    visibleMonth,
    filters: { teacherId },
  });

  // Séances du jour sélectionné, affichées dans le drawer.
  const { data: selectedDaySchedules = [] } = useTeacherDaySchedules({
    teacherId,
    date: selectedDate,
  });

  const dayDecoration = useCallback(
    (date: Date): DayDecoration | undefined =>
      scheduleDays.has(format(date, "yyyy-MM-dd"))
        ? HAS_SCHEDULE_DECORATION
        : undefined,
    [scheduleDays]
  );

  const dayFooter = useCallback(
    (date: Date) =>
      scheduleDays.has(format(date, "yyyy-MM-dd")) ? HAS_SCHEDULE_FOOTER : null,
    [scheduleDays]
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
        month={visibleMonth}
        onMonthChange={setVisibleMonth}
        selected={selectedDate}
        onSelect={handleSelectDate}
        dayDecoration={dayDecoration}
        dayFooter={dayFooter}
        locale={fr}
        todayLabel="Auj."
        classNames={{ root: "w-full " }}
        className="mx-auto p-2 gap-3 h-145"
      />

      <TeacherPlanningDrawer
        className="max-h-[90vh]"
        selectedDate={selectedDate}
        schedules={selectedDaySchedules}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}

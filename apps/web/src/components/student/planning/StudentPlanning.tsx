// src/components/student/planning/StudentPlanning.tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, isSameDay, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import { usePlanningDateFilter } from "@/hooks/data/planning/use-planning-date-filter";
import { studentMonthSchedulesQuery } from "@/services/planning/queries";
import { resolveScheduleUiStatus } from "@/services/schedule/policy";
import { cn, formatTime } from "@/lib/utils";

type Props = {
  classId: string;
  groupIds: string[];
  initialDate: string; // yyyy-MM-dd, validée côté serveur
};

// function relativeLabel(day: Date) {
//   if (isToday(day)) return "Aujourd'hui";
//   if (isTomorrow(day)) return "Demain";
//   if (isYesterday(day)) return "Hier";
//   return format(day, "EEEE", { locale: fr });
// }

export function StudentPlanning({ classId, groupIds, initialDate }: Props) {
  const [dateParam, setDate] = usePlanningDateFilter();
  const activeDate = dateParam ?? parseISO(initialDate);
  const activeDateIso = format(activeDate, "yyyy-MM-dd");

  const now = new Date();

  // Mois complet : immédiat au premier rendu (hydratation SSR), puis en cache client.
  const { data: monthSchedules = [], isPending } = useQuery(
    studentMonthSchedulesQuery({ classId, groupIds, date: activeDateIso }),
  );

  // Filtrage local synchrone : aucune requête serveur entre deux jours du même mois.
  const daySchedules = useMemo(
    () => monthSchedules.filter((s) => isSameDay(new Date(s.startTime), activeDate)),
    [monthSchedules, activeDate],
  );

  // shallow: true → pas de ré-exécution du Server Component à chaque clic.
  const handleDayChange = (offset: number) =>
    setDate(addDays(activeDate, offset), { shallow: true });
  const handleToday = () => setDate(new Date(), { shallow: true });

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
      <header className="flex items-center justify-between px-2 py-1">
        <button
          type="button"
          onClick={() => handleDayChange(-1)}
          aria-label="Jour précédent"
          className="p-2 text-muted-foreground"
        >
          ←
        </button>

        <button
          type="button"
          onClick={handleToday}
          aria-label={isToday(activeDate) ? "Afficher la date du jour" : "Revenir à aujourd'hui"}
          className="flex min-w-0 flex-col items-center leading-tight"
        >
          <h1 className="mr-[-0.2em] text-2xl font-semibold uppercase tracking-[0.2em]">
            {format(activeDate, "EEEE", { locale: fr })}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {format(activeDate, "d MMMM yyyy", { locale: fr })}
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleDayChange(1)}
          aria-label="Jour suivant"
          className="p-2 text-muted-foreground"
        >
          →
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-14">
        {isPending ? (
          <p className="pt-12 text-center text-sm text-muted-foreground">Chargement…</p>
        ) : daySchedules.length === 0 ? (
          <p className="pt-12 text-center text-2xl font-medium">Pas de séance prevue.</p>
        ) : (
          <ul className="divide-y">
            {daySchedules.map((s) => {
              const ui = resolveScheduleUiStatus(s, now);
              const done = ui === "COMPLETED" || ui === "MISSED";
              const canceled = s.status === "CANCELED";
              return (
                <li
                  key={s.id}
                  className={cn(
                    "flex items-baseline gap-4 py-3.5",
                    (done || canceled) && "opacity-50",
                    canceled && "line-through",
                  )}
                >
                  <span className="w-12 shrink-0 text-sm tabular-nums text-muted-foreground">
                    {formatTime(new Date(s.startTime))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{s.course.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[s.teacher.user.firstName, s.teacher.user.lastName].filter(Boolean).join(" ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{s.room.name}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
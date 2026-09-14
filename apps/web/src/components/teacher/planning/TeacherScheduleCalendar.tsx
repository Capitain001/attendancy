// apps/web/src/components/planning/teacher/TeacherScheduleCalendar.tsx
"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday as isTodayFn,
  startOfMonth,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

import { useScheduleDays } from "@/hooks/data/planning/useScheduleDays";
import { useTeacherDaySchedules } from "@/hooks/data/planning/useTeacherDaySchedules";
import { GetSchedulesDto } from "@/services/schedule/generated.types";

export type TeacherScheduleCalendarProps = {
  teacherId: string;
  /** Séances du jour initialement préchargées côté serveur */
  initialSchedules: GetSchedulesDto;
  referenceDate?: Date;
};

const WEEKDAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const STATUS_LABEL: Record<GetSchedulesDto[number]["status"], string> = {
  PENDING: "À venir",
  COMPLETED: "Terminée",
  CANCELED: "Annulée",
  MISSED: "Manquée",
};

function toMondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export function TeacherScheduleCalendar({
  teacherId,
  initialSchedules,
  referenceDate = new Date(),
}: TeacherScheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(referenceDate);

  // 1. Grille mensuelle de points + prefetch des mois adjacents
  const scheduleDays = useScheduleDays({
    visibleMonth: selectedDate,
    filters: { teacherId },
  });

  // 2. Détail du jour sélectionné (fetch dynamique, fallback sur initialSchedules)
// 2. Détail du jour sélectionné (fetch dynamique, fallback sur initialSchedules)
  const { data: daySchedulesRaw, isLoading: isLoadingDay } = useTeacherDaySchedules({
    teacherId,
    date: selectedDate,
    initialTodaySchedules: initialSchedules,
  });

  const monthDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate),
      }),
    [selectedDate],
  );

  const leadingBlanks = toMondayIndex(getDay(startOfMonth(selectedDate)));

  const daySchedules = useMemo(
    () =>
      [...(daySchedulesRaw ?? [])].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    [daySchedulesRaw],
  );

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-md bg-teacher-bg p-6 text-teacher-fg transition-colors sm:p-8">
      <div className="grid h-full w-full flex-1 grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
        
        {/* ── SECTION GAUCHE / MOBILE : Calendrier ── */}
        <div className="my-auto flex w-full flex-col gap-10 lg:col-span-7 sm:gap-8">
          
          {/* Header Date : Chiffre + Mois + Navigation */}
          <div className="flex flex-col gap-1">
            <div className="-mt-2 font-black leading-none tracking-tighter text-teacher-brand text-[6.5rem] sm:text-[7.5rem]">
              {format(selectedDate, "d")}
            </div>

            <div className="flex items-end justify-between leading-none">
              <div className="flex flex-col gap-1 leading-none">
                <span className="text-3xl font-black uppercase tracking-tight text-teacher-fg sm:text-4xl">
                  {format(selectedDate, "MMMM", { locale: fr })}
                </span>
                <span className="text-xl font-semibold text-teacher-muted">
                  {format(selectedDate, "yyyy")}
                </span>
              </div>

              {/* Jours abrégés + Boutons de changement de mois */}
              <div className="flex items-center gap-3">
                <span className="text-2xl font-extrabold uppercase tracking-tight text-teacher-muted sm:text-3xl">
                  {format(selectedDate, "eee", { locale: fr }).slice(0, 3)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Mois précédent"
                    onClick={() => setSelectedDate((d) => subMonths(d, 1))}
                    className="rounded-full p-1 transition-colors hover:bg-teacher-surface-muted"
                  >
                    <ChevronLeft className="h-5 w-5 text-teacher-muted" />
                  </button>
                  <button
                    type="button"
                    aria-label="Mois suivant"
                    onClick={() => setSelectedDate((d) => addMonths(d, 1))}
                    className="rounded-full p-1 transition-colors hover:bg-teacher-surface-muted"
                  >
                    <ChevronRight className="h-5 w-5 text-teacher-muted" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Grille des puces */}
          <div className="flex flex-col gap-2">
            {/* Libellés jours */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="text-[10px] font-semibold text-teacher-muted">
                  {label}
                </span>
              ))}
            </div>

            {/* Bulles de jours */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} className="aspect-square w-full" />
              ))}

              {monthDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const hasSession = scheduleDays.has(key);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentDay = isTodayFn(day);

                let circleStyle = "bg-teacher-surface-muted";

                if (isSelected) {
                  circleStyle = "bg-teacher-brand";
                } else if (hasSession) {
                  circleStyle = "bg-teacher-inverted";
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    aria-label={format(day, "d MMMM yyyy", { locale: fr })}
                    aria-pressed={isSelected}
                    className={`aspect-square w-full max-w-[44px] justify-self-center rounded-full transition-all hover:scale-105 active:scale-95 ${circleStyle} ${
                      isCurrentDay && !isSelected ? "ring-2 ring-teacher-brand ring-offset-2" : ""
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* ── SECTION DROITE : Liste des cours (Desktop lg:) ── */}
        <div className="hidden h-full flex-col gap-4 border-l border-teacher-surface-muted pl-8 lg:col-span-5 lg:flex">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teacher-muted">
              Séances du jour
            </span>
            <span className="rounded-full bg-teacher-surface px-2.5 py-0.5 text-xs font-bold text-teacher-fg">
              {daySchedules.length}
            </span>
          </div>

          {isLoadingDay ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-teacher-surface-muted p-6 text-center text-xs text-teacher-muted">
              Chargement…
            </div>
          ) : daySchedules.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-teacher-surface-muted p-6 text-center text-xs text-teacher-muted">
              Aucune séance ce jour.
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
              {daySchedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-teacher-surface p-4"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-teacher-fg">
                      {s.course.name}
                    </span>
                    <span className="text-xs text-teacher-muted">
                      {format(new Date(s.startTime), "HH:mm")} –{" "}
                      {format(new Date(s.endTime), "HH:mm")} · {s.room.name}
                      {s.group ? ` · ${s.group.name}` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {"isLocked" in s && s.isLocked && (
                      <Lock className="h-3.5 w-3.5 text-teacher-muted" />
                    )}
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        s.status === "CANCELED"
                          ? "bg-teacher-surface-muted text-teacher-muted"
                          : "bg-teacher-inverted text-teacher-inverted-fg"
                      }`}
                    >
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
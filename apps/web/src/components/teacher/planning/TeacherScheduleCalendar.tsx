// src/components/teacher/planning/TeacherScheduleCalendar.tsx
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
import { AnimatePresence, motion } from "framer-motion";
import { Lock } from "lucide-react";

import { useScheduleDays } from "@/hooks/data/planning/useScheduleDays";
import { useTeacherDaySchedules } from "@/hooks/data/planning/useTeacherDaySchedules";
import { GetSchedulesDto } from "@/services/schedule/generated.types";
import { TeacherDaySchedulesSheet } from "./TeacherDaySchedulesSheet";

export type TeacherScheduleCalendarProps = {
  teacherId: string;
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

const SWIPE_THRESHOLD = 50;

export function TeacherScheduleCalendar({
  teacherId,
  initialSchedules,
  referenceDate = new Date(),
}: TeacherScheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(referenceDate);
  const [direction, setDirection] = useState<-1 | 1>(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // 1. Grille mensuelle des jours avec cours
  const scheduleDays = useScheduleDays({
    visibleMonth: selectedDate,
    filters: { teacherId },
  });

  // 2. Détail du jour sélectionné (Panneau droit desktop)
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

  const handleDayClick = (day: Date, hasSession: boolean) => {
    setSelectedDate(day);
    if (hasSession) {
      setIsSheetOpen(true);
    }
  };

  const handleNextMonth = () => {
    setDirection(1);
    setSelectedDate((d) => addMonths(d, 1));
  };

  const handlePrevMonth = () => {
    setDirection(-1);
    setSelectedDate((d) => subMonths(d, 1));
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-md bg-background p-6 text-foreground transition-colors sm:p-8">
      <div className="grid h-full w-full flex-1 grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
        
        {/* ── SECTION GAUCHE / MOBILE : Calendrier Swipable ── */}
        <div className="my-auto flex w-full flex-col gap-8 overflow-hidden lg:col-span-7">
          <div className="flex flex-col gap-1 select-none">
            <div className="-mt-2 font-black leading-none tracking-tighter text-primary text-[6.5rem] sm:text-[7.5rem]">
              {format(selectedDate, "d")}
            </div>

            <div className="flex items-end justify-between leading-none">
              <div className="flex flex-col gap-1 leading-none">
                <span className="text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
                  {format(selectedDate, "MMMM", { locale: fr })}
                </span>
                <span className="text-xl font-semibold text-muted-foreground">
                  {format(selectedDate, "yyyy")}
                </span>
              </div>

              <span className="text-2xl font-extrabold uppercase tracking-tight text-muted-foreground sm:text-3xl">
                {format(selectedDate, "eee", { locale: fr }).slice(0, 3)}
              </span>
            </div>
          </div>

          <div className="relative min-h-[260px] w-full touch-pan-y">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={format(selectedDate, "yyyy-MM")}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -SWIPE_THRESHOLD) handleNextMonth();
                  else if (info.offset.x > SWIPE_THRESHOLD) handlePrevMonth();
                }}
                className="flex w-full cursor-grab flex-col gap-2 active:cursor-grabbing"
              >
                <div className="grid grid-cols-7 gap-1 text-center select-none">
                  {WEEKDAY_LABELS.map((label) => (
                    <span key={label} className="text-[10px] font-semibold text-muted-foreground">
                      {label}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2 sm:gap-3">
                  {Array.from({ length: leadingBlanks }).map((_, i) => (
                    <div key={`blank-${i}`} className="aspect-square w-full" />
                  ))}

                  {monthDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const hasSession = scheduleDays.has(key);
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentDay = isTodayFn(day);

                    let circleStyle = "bg-muted";
                    if (isSelected) {
                      circleStyle = "bg-primary";
                    } else if (hasSession) {
                      circleStyle = "bg-muted-foreground";
                    }

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleDayClick(day, hasSession)}
                        aria-label={format(day, "d MMMM yyyy", { locale: fr })}
                        aria-pressed={isSelected}
                        className={`aspect-square w-full max-w-[44px] justify-self-center rounded-full transition-all hover:scale-105 active:scale-95 ${circleStyle} ${
                          isCurrentDay && !isSelected
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : ""
                        }`}
                      />
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── SECTION DROITE : Vue Liste (Desktop lg:) ── */}
        <div className="hidden h-full flex-col gap-4 border-l border-border pl-8 lg:col-span-5 lg:flex">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Séances du jour
            </span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
              {daySchedules.length}
            </span>
          </div>

          {isLoadingDay ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Chargement…
            </div>
          ) : daySchedules.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Aucune séance ce jour.
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
              {daySchedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 text-card-foreground"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-foreground">
                      {s.course.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(s.startTime), "HH:mm")} –{" "}
                      {format(new Date(s.endTime), "HH:mm")} · {s.room.name}
                      {s.group ? ` · ${s.group.name}` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {s.isLocked && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        s.status === "CANCELED"
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary text-primary-foreground"
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

      {/* Sheet Bottom pour Mobile / Écrans tactiles */}
      <TeacherDaySchedulesSheet
        teacherId={teacherId}
        selectedDate={selectedDate}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        initialTodaySchedules={initialSchedules}
      />
    </div>
  );
}
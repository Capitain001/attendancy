"use client";

import { useRef, useState } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isWithinInterval,
  startOfDay,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { TeacherUnavailabilityItem } from "@/services/teacher-unavailability/types";
import { cn } from "@/lib/utils";

/** Durée de l'appui long (ms) avant de démarrer une sélection de plage. */
const LONG_PRESS_MS = 450;

/**
 * Couleurs "en dur" associées à chaque type d'indisponibilité existante.
 * WEEKLY = récurrente (rose) / DATE_RANGE = ponctuelle (bleu).
 */
const TYPE_STYLES: Record<
  TeacherUnavailabilityItem["type"],
  { dot: string; bg: string; text: string; label: string }
> = {
  WEEKLY: {
    dot: "bg-pink-400",
    bg: "bg-pink-100",
    text: "text-pink-700",
    label: "Récurrente",
  },
  DATE_RANGE: {
    dot: "bg-blue-400",
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "Ponctuelle",
  },
};

const WEEKDAY_LABELS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function isItemActiveOnDate(item: TeacherUnavailabilityItem, date: Date): boolean {
  if (item.type === "WEEKLY" && item.dayOfWeek != null) {
    const jsDay = date.getDay(); // 0 = Dimanche
    const isoDay = jsDay === 0 ? 7 : jsDay;
    return isoDay === item.dayOfWeek;
  }

  if (item.type === "DATE_RANGE" && item.startDate && item.endDate) {
    const start = startOfDay(new Date(item.startDate));
    const end = startOfDay(new Date(item.endDate));
    return isWithinInterval(startOfDay(date), { start, end });
  }

  return false;
}

function getDayType(
  date: Date,
  items: TeacherUnavailabilityItem[]
): TeacherUnavailabilityItem["type"] | null {
  const active = items.filter((item) => isItemActiveOnDate(item, date));
  // DATE_RANGE (ponctuelle, plus spécifique) prioritaire sur WEEKLY quand les deux s'appliquent
  if (active.some((item) => item.type === "DATE_RANGE")) return "DATE_RANGE";
  if (active.some((item) => item.type === "WEEKLY")) return "WEEKLY";
  return null;
}

export type PendingRange = { start: Date | null; end: Date | null };

type RangePosition = "none" | "single" | "start" | "end" | "middle";

function getRangePosition(date: Date, range: PendingRange): RangePosition {
  if (!range.start) return "none";

  if (!range.end) {
    return isSameDay(date, range.start) ? "single" : "none";
  }

  const day = startOfDay(date);
  const start = startOfDay(range.start);
  const end = startOfDay(range.end);

  if (day < start || day > end) return "none";
  if (isSameDay(day, start) && isSameDay(day, end)) return "single";
  if (isSameDay(day, start)) return "start";
  if (isSameDay(day, end)) return "end";
  return "middle";
}

const RANGE_BAND_CLASSES: Record<Exclude<RangePosition, "none">, string> = {
  single: "inset-x-2 rounded-full",
  start: "left-2 right-0 rounded-l-full",
  end: "left-0 right-2 rounded-r-full",
  middle: "inset-x-0 rounded-none",
};

export function UnavailabilityCalendar({
  items,
  selected,
  range,
  onDayClick,
  onDayLongPress,
}: {
  items: TeacherUnavailabilityItem[];
  /** Jour sélectionné pour la vue "jour" (affiché avec un anneau). */
  selected?: Date | null;
  /** Plage en cours de sélection (démarrée par un appui long), affichée en pill connectée. */
  range?: PendingRange;
  /** Tap normal — ouvre le jour, ou pose la date de fin si une plage est en cours. */
  onDayClick: (date: Date) => void;
  /** Appui long — démarre une sélection de plage sur ce jour. */
  onDayLongPress: (date: Date) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState<Date>(selected ?? new Date());
  const [pressingDay, setPressingDay] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Un seul appui possible à la fois : refs partagées plutôt qu'un state par cellule.
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setPressingDay(null);
  };

  const handlePointerDown = (day: Date) => {
    longPressFiredRef.current = false;
    clearPressTimer();
    setPressingDay(day.getTime());
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setPressingDay(null);
      onDayLongPress(day);
    }, LONG_PRESS_MS);
  };

  const handleClick = (day: Date) => {
    // Le tap qui suit le relâchement d'un appui long ne doit pas rouvrir le jour
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    onDayClick(day);
  };

  const gridStart = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const activeRange: PendingRange = range ?? { start: null, end: null };

  // Pendant qu'on choisit la date de fin (début posé, fin pas encore cliquée), on
  // prévisualise la plage jusqu'au jour survolé — comportement classique de date-range picker.
  const isPicking = activeRange.start !== null && activeRange.end === null;
  const hoveredDate = hoveredDay !== null ? new Date(hoveredDay) : null;

  let displayRange: PendingRange = activeRange;
  if (isPicking && hoveredDate && activeRange.start) {
    const start = activeRange.start;
    displayRange =
      hoveredDate < start ? { start: hoveredDate, end: start } : { start, end: hoveredDate };
  }

  return (
    <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-sm">
      {/* En-tête : mois + navigation */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold capitalize">
          {format(visibleMonth, "MMMM yyyy", { locale: fr })}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Labels des jours de la semaine */}
      <div className="mb-2 grid grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[11px] font-medium uppercase text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, visibleMonth);
          const today = isToday(day);
          const isSelected = selected ? isSameDay(day, selected) : false;
          const dayType = getDayType(day, items);
          const style = dayType ? TYPE_STYLES[dayType] : null;
          const rangePosition = getRangePosition(day, displayRange);

          return (
            <div key={day.toISOString()} className="relative flex items-center justify-center py-0.5">
              {/* Bande de sélection de plage (derrière le cercle du jour) */}
              {rangePosition !== "none" && (
                <div
                  className={cn(
                    "absolute inset-y-0.5 bg-primary/15",
                    RANGE_BAND_CLASSES[rangePosition]
                  )}
                />
              )}

              <button
                type="button"
                onPointerDown={() => handlePointerDown(day)}
                onPointerUp={clearPressTimer}
                onPointerLeave={clearPressTimer}
                onPointerCancel={clearPressTimer}
                onContextMenu={(e) => e.preventDefault()}
                onClick={() => handleClick(day)}
                onMouseEnter={() => setHoveredDay(day.getTime())}
                onMouseLeave={() => setHoveredDay(null)}
                className={cn(
                  "relative z-10 flex h-9 w-9 touch-manipulation select-none items-center justify-center rounded-full text-sm transition-transform",
                  !inMonth && "text-muted-foreground/40",
                  inMonth && !style && "text-foreground hover:bg-muted",
                  inMonth && style && cn(style.bg, style.text, "font-medium hover:opacity-80"),
                  rangePosition !== "none" && !style && "font-semibold text-primary",
                  today && "bg-neutral-900 text-white hover:bg-neutral-900",
                  isSelected && !today && "ring-2 ring-neutral-900 ring-offset-1 ring-offset-card",
                  pressingDay === day.getTime() && "scale-90 bg-muted"
                )}
              >
                {format(day, "d")}
              </button>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
        {(Object.keys(TYPE_STYLES) as Array<keyof typeof TYPE_STYLES>).map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-2.5 w-2.5 rounded-full", TYPE_STYLES[key].dot)} />
            {TYPE_STYLES[key].label}
          </div>
        ))}
      </div>
    </div>
  );
}
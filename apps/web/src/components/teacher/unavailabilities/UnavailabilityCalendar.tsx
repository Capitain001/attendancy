"use client";

import * as React from "react";
import { isSameDay, isWithinInterval, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Check } from "lucide-react";
import type { DateRange } from "react-day-picker";

import type { TeacherUnavailabilityItem } from "@/services/teacher-unavailability/types";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

/** Durée de l'appui long (ms) avant de déclencher le mode sélection de plage. */
const LONG_PRESS_MS = 450;

/**
 * Couleurs "en dur" associées à chaque type d'indisponibilité existante.
 * WEEKLY = récurrente (rose) / DATE_RANGE = ponctuelle (bleu).
 */
const TYPE_STYLES: Record<
  TeacherUnavailabilityItem["type"],
  { dot: string; className: string; label: string }
> = {
  WEEKLY: {
    dot: "bg-pink-400",
    className: "bg-pink-100 text-pink-700 hover:bg-pink-100 hover:text-pink-700",
    label: "Récurrente",
  },
  DATE_RANGE: {
    dot: "bg-blue-400",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700",
    label: "Ponctuelle",
  },
};

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

type DayButtonContextValue = {
  isDateRangeDay: (date: Date) => boolean;
  isWeeklyDay: (date: Date) => boolean;
  onLongPressDay: (date: Date) => void;
  /** Jour de fin d'une plage complète en attente de confirmation (coche affichée dessus). */
  pendingConfirmDate: Date | null;
  onConfirmRange: () => void;
  onCancelRange: () => void;
};

const DayButtonContext = React.createContext<DayButtonContextValue | null>(null);

/**
 * DayButton custom : détecte l'appui long (démarre le mode plage), superpose la teinte
 * rose/bleue selon le type d'indisponibilité, et affiche une coche de confirmation
 * centrée sur le jour de fin une fois la plage complète.
 */
function UnavailabilityDayButton(props: React.ComponentProps<typeof CalendarDayButton>) {
  const { day, modifiers, className, onClick, ...rest } = props;
  const ctx = React.useContext(DayButtonContext);

  const pressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = React.useRef(false);

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = () => {
    longPressFiredRef.current = false;
    clearPressTimer();
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      ctx?.onLongPressDay(day.date);
    }, LONG_PRESS_MS);
  };

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    // Le clic qui suit le relâchement d'un appui long ne doit pas déclencher la sélection normale
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const dayType = ctx?.isDateRangeDay(day.date)
    ? "dateRange"
    : ctx?.isWeeklyDay(day.date)
      ? "weekly"
      : null;

  const isPartOfRangeSelection =
    modifiers.selected || modifiers.range_start || modifiers.range_end || modifiers.range_middle;

  const showConfirm = ctx?.pendingConfirmDate ? isSameDay(ctx.pendingConfirmDate, day.date) : false;

  return (
    <span className="relative inline-flex">
      <CalendarDayButton
        day={day}
        modifiers={modifiers}
        onPointerDown={handlePointerDown}
        onPointerUp={clearPressTimer}
        onPointerLeave={clearPressTimer}
        onPointerCancel={clearPressTimer}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => {
          // Sur le jour de fin en attente de confirmation, le clic valide la plage
          // plutôt que de rouvrir la sélection normale.
          if (showConfirm) {
            event.preventDefault();
            ctx?.onConfirmRange();
            return;
          }
          handleClick(event);
        }}
        className={cn(
          className,
          "touch-manipulation select-none",
          dayType && !isPartOfRangeSelection && "font-medium",
          dayType === "weekly" && !isPartOfRangeSelection && TYPE_STYLES.WEEKLY.className,
          dayType === "dateRange" && !isPartOfRangeSelection && TYPE_STYLES.DATE_RANGE.className,
          showConfirm && "text-transparent"
        )}
        {...rest}
      />

      {/* Plage complète en attente de confirmation : coche centrée sur le jour de fin. */}
      {showConfirm && (
        <Check className="pointer-events-none absolute inset-0 m-auto h-4 w-4 text-primary-foreground" />
      )}
    </span>
  );
}

export function UnavailabilityCalendar({
  items,
  pickerMode,
  selectedDate,
  range,
  pendingConfirmRange,
  onDaySelect,
  onRangeChange,
  onLongPressDay,
  onConfirmRange,
  onCancelRange,
}: {
  items: TeacherUnavailabilityItem[];
  /** "single" pour un tap classique (ouvre le drawer immédiatement), "range" pendant/après un appui long. */
  pickerMode: "single" | "range";
  selectedDate: Date | null;
  range: DateRange | undefined;
  /** Plage complète (from + to) en attente de confirmation via la coche sur le jour de fin. */
  pendingConfirmRange: DateRange | null;
  onDaySelect: (date: Date | undefined) => void;
  onRangeChange: (range: DateRange | undefined) => void;
  onLongPressDay: (date: Date) => void;
  onConfirmRange: () => void;
  onCancelRange: () => void;
}) {
  const isDateRangeDay = React.useCallback(
    (date: Date) =>
      items.some((item) => item.type === "DATE_RANGE" && isItemActiveOnDate(item, date)),
    [items]
  );
  const isWeeklyDay = React.useCallback(
    (date: Date) =>
      !isDateRangeDay(date) &&
      items.some((item) => item.type === "WEEKLY" && isItemActiveOnDate(item, date)),
    [items, isDateRangeDay]
  );

  // Mois affiché conservé indépendamment du bascule single/range pour ne pas sauter de mois
  // quand on entre/sort du mode plage.
  const [month, setMonth] = React.useState<Date>(selectedDate ?? new Date());

  // Plage complète en attente de confirmation : un clic n'importe où en dehors du calendrier
  // annule la sélection (pas de bouton croix nécessaire, cliquer un autre jour la remplace déjà
  // nativement via onRangeChange).
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!pendingConfirmRange) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onCancelRange();
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () => document.removeEventListener("pointerdown", handlePointerDownOutside);
  }, [pendingConfirmRange, onCancelRange]);

  const contextValue: DayButtonContextValue = {
    isDateRangeDay,
    isWeeklyDay,
    onLongPressDay,
    pendingConfirmDate: pendingConfirmRange?.to ?? null,
    onConfirmRange,
    onCancelRange,
  };

  // `mode` est une union discriminée côté react-day-picker : le type de `selected`/`onSelect`
  // dépend de sa valeur ("single" -> Date | undefined, "range" -> DateRange | undefined).
  // On construit donc les props propres à chaque mode dans leur branche respective (chacune
  // correctement typée), pour ensuite les spreader sur un unique <Calendar />.
  const modeProps =
    pickerMode === "single"
      ? ({
          mode: "single",
          required: true,
          selected: selectedDate ?? undefined,
          onSelect: onDaySelect,
        } as const)
      : ({
          mode: "range",
          selected: range,
          onSelect: onRangeChange,
        } as const);

  return (
    <div ref={containerRef} className=" rounded-3xl bg-card/40 p-1">
      <DayButtonContext.Provider value={contextValue}>
        <Calendar
          locale={fr}
          month={month}
          onMonthChange={setMonth}
          modifiers={{ weekly: isWeeklyDay, dateRange: isDateRangeDay }}
          components={{ DayButton: UnavailabilityDayButton }}
          className="mx-auto p-2"
          {...modeProps}
        />
      </DayButtonContext.Provider>

      {pickerMode === "range" && !pendingConfirmRange && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Sélectionnez la date de fin de la plage.
        </p>
      )}

      {/* Légende */}
      {/* <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
        {(Object.keys(TYPE_STYLES) as Array<keyof typeof TYPE_STYLES>).map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-2.5 w-2.5 rounded-full", TYPE_STYLES[key].dot)} />
            {TYPE_STYLES[key].label}
          </div>
        ))}
      </div> */}
    </div>
  );
}
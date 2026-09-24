"use client";

import * as React from "react";
import { isSameDay, isWithinInterval, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Check } from "lucide-react";
import type { DateRange } from "react-day-picker";

import type { TeacherUnavailabilityItem } from "@/services/teacher-unavailability/types";
import { Calendar, CalendarDayButton } from "@/components/ui/custom/calendar";
import { cn } from "@/lib/utils";

/** Durée de l'appui long (ms) avant de déclencher le mode sélection de plage. */
const LONG_PRESS_MS = 450;

/** Point affiché sous chaque jour concerné : WEEKLY = récurrente (rose) / DATE_RANGE = ponctuelle (bleu). */
export const TYPE_STYLES: Record<
  TeacherUnavailabilityItem["type"],
  { dot: string; label: string }
> = {
  WEEKLY: { dot: "bg-pink-400", label: "Récurrente" },
  DATE_RANGE: { dot: "bg-blue-400", label: "Ponctuelle" },
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
  onLongPressDay: (date: Date) => void;
  /** Jour de fin d'une plage complète en attente de confirmation (coche affichée dessus). */
  pendingConfirmDate: Date | null;
  onConfirmRange: () => void;
};

const DayButtonContext = React.createContext<DayButtonContextValue | null>(null);

/**
 * DayButton custom : détecte l'appui long (démarre le mode plage) et affiche une coche
 * de confirmation sur le jour de fin une fois la plage complète. Le rendu du jour (cercle,
 * bulle « aujourd'hui », points) est délégué à CalendarDayButton.
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

  // Nettoyage si le bouton est démonté pendant un appui
  React.useEffect(() => clearPressTimer, []);

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = () => {
    longPressFiredRef.current = false;
    clearPressTimer();
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      ctx?.onLongPressDay(day.date);
    }, LONG_PRESS_MS);
  };

  const showConfirm = ctx?.pendingConfirmDate ? isSameDay(ctx.pendingConfirmDate, day.date) : false;

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    // Le clic qui suit le relâchement d'un appui long ne doit pas déclencher la sélection normale
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      event.preventDefault();
      return;
    }
    // Sur le jour de fin en attente de confirmation, le clic valide la plage
    if (showConfirm) {
      event.preventDefault();
      ctx?.onConfirmRange();
      return;
    }
    onClick?.(event);
  };

  return (
    <span className="relative flex w-full justify-center">
      <CalendarDayButton
        day={day}
        modifiers={modifiers}
        onPointerDown={handlePointerDown}
        onPointerUp={clearPressTimer}
        onPointerLeave={clearPressTimer}
        onPointerCancel={clearPressTimer}
        onContextMenu={(event) => event.preventDefault()}
        onClick={handleClick}
        className={cn(className, "touch-manipulation select-none")}
        {...rest}
      />

      {/* Plage complète en attente de confirmation : coche posée sur le cercle du jour de fin */}
      {showConfirm && (
        <span className="pointer-events-none absolute top-0 left-1/2 flex size-(--cell-size) -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-4" />
        </span>
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
  // Points sous chaque jour : un point par type d'indisponibilité active ce jour-là
  const dayFooter = React.useCallback(
    (date: Date) => {
      const hasWeekly = items.some((i) => i.type === "WEEKLY" && isItemActiveOnDate(i, date));
      const hasRange = items.some((i) => i.type === "DATE_RANGE" && isItemActiveOnDate(i, date));
      if (!hasWeekly && !hasRange) return null;

      return (
        <span className="flex gap-0.5">
          {hasWeekly && <span className={cn("size-1.5 rounded-full", TYPE_STYLES.WEEKLY.dot)} />}
          {hasRange && <span className={cn("size-1.5 rounded-full", TYPE_STYLES.DATE_RANGE.dot)} />}
        </span>
      );
    },
    [items]
  );

  // Mois affiché conservé indépendamment du bascule single/range pour ne pas sauter de mois
  // quand on entre/sort du mode plage.
  const [month, setMonth] = React.useState<Date>(selectedDate ?? new Date());

  // Plage complète en attente de confirmation : un clic en dehors du calendrier l'annule.
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

  const pendingConfirmDate = pendingConfirmRange?.to ?? null;
  const contextValue = React.useMemo<DayButtonContextValue>(
    () => ({ onLongPressDay, pendingConfirmDate, onConfirmRange }),
    [onLongPressDay, pendingConfirmDate, onConfirmRange]
  );

  // `mode` est une union discriminée côté react-day-picker : on construit les props propres
  // à chaque mode dans leur branche (correctement typée), puis on les spread sur <Calendar />.
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
    <div ref={containerRef} className="w-full  p-1">
      <DayButtonContext.Provider value={contextValue}>
        <Calendar
          locale={fr}
          month={month}
          onMonthChange={setMonth}
          todayLabel="Auj."
          dayFooter={dayFooter}
          components={{ DayButton: UnavailabilityDayButton }}
          classNames={{ root: "w-full max-w-sm" }}
          className="mx-auto p-2 "
          {...modeProps}
        />
      </DayButtonContext.Provider>

      {/* {pickerMode === "range" && !pendingConfirmRange && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Sélectionnez la date de fin de la plage.
        </p>
      )} */}

      {/* Légende : nécessaire maintenant que les types ne sont distingués que par les points */}
      <div className="mt-4 flex items-center justify-center gap-4 border-t border-border pt-3">
        {(Object.keys(TYPE_STYLES) as Array<keyof typeof TYPE_STYLES>).map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("size-2.5 rounded-full", TYPE_STYLES[key].dot)} />
            {TYPE_STYLES[key].label}
          </div>
        ))}
      </div>
    </div>
  );
}
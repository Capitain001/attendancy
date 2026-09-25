"use client";

import * as React from "react";
import { isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Check } from "lucide-react";
import type { DateRange } from "react-day-picker";

import type { TeacherUnavailabilityItem } from "@/services/teacher-unavailability/types";
import { appliesOnDay, getTimeWindow } from "@/services/teacher-unavailability/policy";
import { Calendar, CalendarDayButton, type DayDecoration } from "@/components/ui/custom/calendar";
import { cn } from "@/lib/utils";

/** Durée de l'appui long (ms) avant de déclencher le mode sélection de plage. */
const LONG_PRESS_MS = 450;

/**
 * Point affiché sous chaque jour concerné : WEEKLY = récurrente (rose) / DATE_RANGE = ponctuelle (bleu).
 * Conservée pour compatibilité API (branchable sur `dayFooter`), non utilisée par défaut :
 * l'information est désormais portée par le cercle du jour via DAY_DECORATION_STYLES.
 */
export const TYPE_STYLES: Record<
  TeacherUnavailabilityItem["type"],
  { dot: string; label: string }
> = {
  WEEKLY: { dot: "bg-pink-400", label: "Récurrente" },
  DATE_RANGE: { dot: "bg-blue-400", label: "Ponctuelle" },
};

/**
 * Config visuelle des indicateurs cumulables sur le cercle du jour.
 * Seul endroit à modifier pour ajuster la palette (ex: brancher des tokens
 * de design system plus tard à la place de couleurs Tailwind brutes).
 *
 * Modèle : 3 axes indépendants, chacun porté par une propriété CSS distincte,
 * donc librement cumulables sur un même jour (un jour peut avoir un item
 * récurrent ET un item ponctuel qui s'appliquent tous les deux) :
 *
 *   - hachure  -> au moins un item qui s'applique ce jour-là couvre la
 *                 journée entière (aucun horaire défini dessus)
 *   - anneau   -> au moins un item récurrent (WEEKLY) s'applique ce jour-là
 *   - fond     -> au moins un item ponctuel (DATE_RANGE, un jour ou une
 *                 période) s'applique ce jour-là
 *
 * Un item avec horaire restreint (ex: 8h-10h) et non récurrent n'a donc ni
 * hachure ni anneau, seulement le fond — c'est le cas "journée normale sauf
 * un créneau précis", visuellement distinct d'une indispo. sur toute la
 * journée ou d'une récurrence hebdomadaire.
 */
export const DAY_DECORATION_STYLES = {
  /** Au moins un item applicable ce jour n'a pas d'horaire défini (= journée entière). */
  fullDay: {
    /** Couleur CSS brute des rayures (injectée en style inline, pas une classe Tailwind). */
    hatchColor: "rgba(120,120,120,0.35)",
    legendLabel: "Journée entière",
  },
  /** Au moins un item récurrent (WEEKLY) s'applique ce jour. */
  weekly: {
    ringClassName: "ring-2 ring-pink-400",
    legendClassName: "ring-2 ring-pink-400",
    legendLabel: "Récurrente (hebdo)",
  },
  /** Au moins un item ponctuel (DATE_RANGE — un jour ou une période) s'applique ce jour. */
  dateRange: {
    fillClassName: "bg-blue-400/25",
    legendClassName: "bg-blue-400/25 border border-border",
    legendLabel: "Date ou période spécifique",
  },
} as const;

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
 * bulle « aujourd'hui », points, décoration) est délégué à CalendarDayButton.
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
  // API conservée (non branchée sur <Calendar/> par défaut, cf. TYPE_STYLES) :
  // un point par type d'indisponibilité active ce jour-là. Réactivable en
  // passant `dayFooter={dayFooter}` à <Calendar/> ci-dessous.
  const dayFooter = React.useCallback(
    (date: Date) => {
      const hasWeekly = items.some((i) => i.type === "WEEKLY" && appliesOnDay(i, date));
      const hasRange = items.some((i) => i.type === "DATE_RANGE" && appliesOnDay(i, date));
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

  // Décoration du cercle : hachure (au moins un item "journée entière" ce jour)
  // + anneau (au moins un item récurrent) + fond (au moins un item ponctuel
  // DATE_RANGE, quelle que soit sa durée) — 3 axes indépendants, cumulables.
  //
  // Important : on ne restreint PAS le fond aux items d'un seul jour. Un item
  // DATE_RANGE sur plusieurs jours (vacances, absence d'une semaine...) doit
  // recevoir le même indicateur "date/période spécifique" sur chacun des
  // jours qu'il couvre — la durée de la période n'est pas pertinente pour
  // ce channel visuel, seul le fait que ce soit un item "non récurrent" l'est.
  const dayDecoration = React.useCallback(
    (date: Date): DayDecoration | undefined => {
      let hasFullDay = false;
      let hasWeekly = false;
      let hasDateRange = false;

      for (const item of items) {
        if (!appliesOnDay(item, date)) continue;

        // Aucune plage horaire sur l'item -> l'indisponibilité couvre la journée entière.
        if (!getTimeWindow(item)) hasFullDay = true;

        if (item.type === "WEEKLY") hasWeekly = true;
        if (item.type === "DATE_RANGE") hasDateRange = true;
      }

      if (!hasFullDay && !hasWeekly && !hasDateRange) return undefined;

      return {
        hatchColor: hasFullDay ? DAY_DECORATION_STYLES.fullDay.hatchColor : undefined,
        ringClassName: hasWeekly ? DAY_DECORATION_STYLES.weekly.ringClassName : undefined,
        fillClassName: hasDateRange ? DAY_DECORATION_STYLES.dateRange.fillClassName : undefined,
      };
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
    <div ref={containerRef} className="w-full h-full flex-1 flex flex-col justify-between p-1">
      <DayButtonContext.Provider value={contextValue}>
        <Calendar
          locale={fr}
          month={month}
          onMonthChange={setMonth}
          todayLabel="Auj."
          dayDecoration={dayDecoration}
          components={{ DayButton: UnavailabilityDayButton }}
          classNames={{ root: "w-full " }}
          className="mx-auto p-2 gap-3 h-[580px]" // taille stable sans décalage entre les mois
          {...modeProps}
        />
      </DayButtonContext.Provider>

      {/* Légende — dérivée de DAY_DECORATION_STYLES, un seul endroit à synchroniser.
          Les 3 indicateurs sont cumulables : un jour peut afficher plusieurs
          d'entre eux en même temps (ex: hachure + anneau = récurrence sur
          toute la journée ; hachure + fond = période ponctuelle sur toute la
          journée). Un item à horaire partiel, non récurrent, n'affiche que le
          fond, sans hachure ni anneau. */}
      <div className="flex flex-col items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span
            className="size-3.5 rounded-full border border-border"
            style={{
              backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 3px, ${DAY_DECORATION_STYLES.fullDay.hatchColor} 3px, ${DAY_DECORATION_STYLES.fullDay.hatchColor} 6px)`,
            }}
          />
          {DAY_DECORATION_STYLES.fullDay.legendLabel}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("size-3.5 rounded-full", DAY_DECORATION_STYLES.weekly.legendClassName)} />
          {DAY_DECORATION_STYLES.weekly.legendLabel}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("size-3.5 rounded-full", DAY_DECORATION_STYLES.dateRange.legendClassName)} />
          {DAY_DECORATION_STYLES.dateRange.legendLabel}
        </div>
      </div>
    </div>
  );
}
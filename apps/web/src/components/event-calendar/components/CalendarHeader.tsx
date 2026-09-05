import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format, startOfMonth, endOfMonth, getDaysInMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarView } from "../types";
import { getWeekStart, getWeekEnd } from "../utils";
import { ViewSelector, ViewSelectorDropdown } from "./ViewSelector";
import Link from "next/link";



function formatDateRange(start: Date, end: Date, locale = fr): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    const isFullMonth =
      start.getDate() === 1 && end.getDate() === getDaysInMonth(start);
    // "février 2026"
    if (isFullMonth) return format(start, "MMMM yyyy", { locale });
    // "1 - 15 février 2026"
    return `${format(start, "d")} - ${format(end, "d MMMM yyyy", { locale })}`;
  }

  if (sameYear) {
    return `${format(start, "d MMM", { locale })} - ${format(end, "d MMM yyyy", { locale })}`;
  }

  return `${format(start, "d MMM yyyy", { locale })} - ${format(end, "d MMM yyyy", { locale })}`;
}

interface CalendarHeaderProps {
  view: CalendarView;
  setView: (view: CalendarView) => void;
  selectedDay: Date;
  firstDayCurrentMonth: Date;
  previousPeriod: () => void;
  nextPeriod: () => void;
  goToToday: () => void;
  today: Date;
  href?: string;
  title?: string;
}

export function CalendarHeader({
  view,
  setView,
  selectedDay,
  firstDayCurrentMonth,
  previousPeriod,
  nextPeriod,
  goToToday,
  today,
  href,
  title,
}: CalendarHeaderProps) {
  const periodLabel =
    view === "day"
      ? format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })
      : view === "week"
        ? formatDateRange(getWeekStart(selectedDay), getWeekEnd(selectedDay))
        : formatDateRange(startOfMonth(firstDayCurrentMonth), endOfMonth(firstDayCurrentMonth));

  return (
    <div className="flex space-y-4 md:p-4  md:pt-0 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
      <div className="flex flex-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={previousPeriod}
              variant="outline"
              size="icon"
              className="h-8 w-6 shrink-0"
              aria-label="Période précédente"
            >
              <ChevronLeftIcon size={16} />
            </Button>

            <button
              type="button"
              onClick={goToToday}
              className="w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 flex transition-colors hover:bg-muted/80 "
            >
              <h1 className="p-1 text-xs uppercase text-muted-foreground">
                {format(today, "MMM", { locale: fr })}
              </h1>
              <div className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-lg font-bold cursor-pointer">
                <span>{format(today, "d")}</span>
              </div>
            </button>

            <Button
              onClick={nextPeriod}
              variant="outline"
              size="icon"
              className="h-8 w-6 shrink-0"
              aria-label="Période suivante"
            >
              <ChevronRightIcon size={16} />
            </Button>
          </div>

          <div className="flex flex-col">
            <Link
              href={href || "#"}
              className="text-lg font-semibold hidden md:inline text-foreground hover:text-primary hover:underline uppercase"
            >
              {title}
            </Link>
            <p className="font-semibold text-foreground text-sm md:text-lg">
              {periodLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 justify-between md:flex-row md:gap-6">
        <Separator orientation="vertical" className="hidden h-6 md:block" />
        {/* Onglets en desktop, menu déroulant en mobile (< md) */}
        <div className="hidden md:block">
          <ViewSelector view={view} setView={setView} />
        </div>
        <div className="md:hidden">
          <ViewSelectorDropdown view={view} setView={setView} />
        </div>
      </div>
    </div>
  );
}

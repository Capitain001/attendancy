// src/components/layout/sidebar/views/planning-filters.tsx
"use client";

import { Suspense, useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  CircleDashed,
  DoorOpen,
  GraduationCap,
  RotateCcw,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";
import { DATE_LOCALE } from "@/lib/date";
import { usePlanningDateFilter } from "@/hooks/data/planning/use-planning-date-filter";
import { usePlanningFilters } from "@/hooks/data/planning/usePlanningFilters";
import { useOrgPlanningResources } from "@/hooks/data/planning/useOrgPlanningResources";
import { useClassGroups } from "@/hooks/data/planning/useClassGroups";
import { useScheduleDays } from "@/hooks/data/planning/useScheduleDays";
import {
  ClassFilter,
  GroupFilter,
  TeacherFilter,
  RoomFilter,
  StatusFilter,
  SCHEDULE_STATUS_OPTIONS,
} from "@/components/planning/filters";

// Fond coloré des jours ayant au moins une séance. Posé sur la cellule :
// le bouton "selected" (bg-primary) le recouvre → l'état sélectionné reste dominant.
const HAS_SCHEDULE_CLASS =
  "rounded-full bg-amber-100 text-amber-900 font-semibold dark:bg-amber-500/15 dark:text-amber-200";

// Public : Suspense intégré (useQueryState lit useSearchParams)
export function PlanningFilters() {
  return (
    <Suspense fallback={<PlanningFiltersFallback />}>
      <PlanningFiltersClient />
    </Suspense>
  );
}

function PlanningFiltersClient() {
  const { state } = useSidebar();
  const [date, setDate] = usePlanningDateFilter();
  const { filters, set, resetAll, activeCount } = usePlanningFilters();
  const { classes, teachers, rooms } = useOrgPlanningResources();
  const { groups } = useClassGroups(filters.classIds);

  // Mois affiché par le calendrier (+ prefetch des mois adjacents).
  const [visibleMonth, setVisibleMonth] = useState(date ?? new Date());
  const scheduleDays = useScheduleDays(visibleMonth);
  const scheduleModifiers = {
    hasSchedule: (day: Date) => scheduleDays.has(format(day, "yyyy-MM-dd")),
  };
  const scheduleModifiersClassNames = { hasSchedule: HAS_SCHEDULE_CLASS };

  const classOptions = classes.map((c) => ({ value: c.id, label: c.name }));
  const groupOptions = groups.map((g) => ({ value: g.id, label: g.name }));
  const teacherOptions = teachers.map((t) => ({ value: t.id, label: t.name }));
  const roomOptions = rooms.map((r) => ({ value: r.id, label: r.name }));
  const statusOptions = SCHEDULE_STATUS_OPTIONS.map((s) => ({
    value: s.value,
    label: s.label,
    icon: <span className={cn("size-2 rounded-full", s.dot)} />,
  }));

  // ── Mode replié : colonne d'icônes + popovers ──────────────────
  if (state === "collapsed") {
    return (
      <div className="flex flex-col items-center gap-1 py-2">
        <CollapsedFilter
          label="Date"
          icon={<CalendarDays className="size-4" />}
          badge={date ? date.getDate() : undefined}
          onReset={date ? () => setDate(null) : undefined}
          resetLabel="Retirer la date"
        >
          <Calendar
            mode="single"
            locale={DATE_LOCALE}
            selected={date ?? undefined}
            onSelect={(d) => setDate(d ?? null)}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            modifiers={scheduleModifiers}
            modifiersClassNames={scheduleModifiersClassNames}
            className="w-full"
          />
        </CollapsedFilter>

        <CollapsedFilter
          label="Classe"
          icon={<GraduationCap className="size-4" />}
          badge={filters.classIds.length || undefined}
          onReset={filters.classIds.length ? () => set.classIds([]) : undefined}
        >
          <MultiSelect
            options={classOptions}
            value={filters.classIds}
            onChange={set.classIds}
            placeholder="Toutes les classes"
          />
        </CollapsedFilter>

        <CollapsedFilter
          label="Groupe"
          icon={<Users className="size-4" />}
          badge={filters.groupIds.length || undefined}
          onReset={filters.groupIds.length ? () => set.groupIds([]) : undefined}
        >
          <MultiSelect
            options={groupOptions}
            value={filters.groupIds}
            onChange={set.groupIds}
            disabled={filters.classIds.length === 0}
            placeholder={
              filters.classIds.length === 0
                ? "Sélectionnez une classe"
                : "Tous les groupes"
            }
            emptyText="Aucun groupe."
          />
        </CollapsedFilter>

        <CollapsedFilter
          label="Enseignant"
          icon={<UserRound className="size-4" />}
          badge={filters.teacherIds.length || undefined}
          onReset={
            filters.teacherIds.length ? () => set.teacherIds([]) : undefined
          }
        >
          <MultiSelect
            options={teacherOptions}
            value={filters.teacherIds}
            onChange={set.teacherIds}
            placeholder="Tous les enseignants"
          />
        </CollapsedFilter>

        <CollapsedFilter
          label="Salle"
          icon={<DoorOpen className="size-4" />}
          badge={filters.roomIds.length || undefined}
          onReset={filters.roomIds.length ? () => set.roomIds([]) : undefined}
        >
          <MultiSelect
            options={roomOptions}
            value={filters.roomIds}
            onChange={set.roomIds}
            placeholder="Toutes les salles"
          />
        </CollapsedFilter>

        <CollapsedFilter
          label="Statut"
          icon={<CircleDashed className="size-4" />}
          badge={filters.statuses.length || undefined}
          onReset={filters.statuses.length ? () => set.statuses([]) : undefined}
        >
          <MultiSelect
            options={statusOptions}
            value={filters.statuses}
            onChange={(v) => set.statuses(v as typeof filters.statuses)}
            placeholder="Tous les statuts"
            searchable={false}
          />
        </CollapsedFilter>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 size-8 text-muted-foreground hover:text-destructive"
            onClick={resetAll}
            title={`Réinitialiser tout (${activeCount})`}
            aria-label="Réinitialiser tous les filtres"
          >
            <RotateCcw className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  // ── Mode déplié : groupes complets ─────────────────────────────
  return (
    <div className="flex flex-col gap-1">
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            Date
          </span>
          {date && (
            <button
              type="button"
              onClick={() => setDate(null)}
              className="text-[10px] font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              Aujourd&apos;hui
            </button>
          )}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="">
            <Calendar
              mode="single"
              locale={DATE_LOCALE}
              selected={date ?? undefined}
              onSelect={(d) => setDate(d ?? null)} // re-clic -> null = retiré de l'URL
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              modifiers={scheduleModifiers}
              modifiersClassNames={scheduleModifiersClassNames}
              className="w-full [--cell-size:2.1rem] rounded-xl border border-border/60  p-1"
              classNames={{
                day_button: "rounded-full",
                day: "rounded-full",
                today: "rounded-full",
              }}
            />
          </div>
          {date && (
            <p className="mt-2 text-center text-[11px] capitalize text-muted-foreground">
              {format(date, "eeee d MMMM yyyy", { locale: DATE_LOCALE })}
            </p>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <div className="mx-2 h-px bg-border/50" />

      <ClassFilter
        options={classOptions}
        value={filters.classIds}
        onChange={set.classIds}
      />

      <GroupFilter
        disabled={filters.classIds.length === 0}
        options={groupOptions}
        value={filters.groupIds}
        onChange={set.groupIds}
      />

      <TeacherFilter
        options={teacherOptions}
        value={filters.teacherIds}
        onChange={set.teacherIds}
      />

      <RoomFilter
        options={roomOptions}
        value={filters.roomIds}
        onChange={set.roomIds}
      />

      <StatusFilter value={filters.statuses} onChange={set.statuses} />

      {activeCount > 0 && (
        <div className="px-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            onClick={resetAll}
          >
            <RotateCcw className="size-3.5" />
            Réinitialiser ({activeCount})
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Bouton icône + badge + popover de contrôle (mode replié) ────
interface CollapsedFilterProps {
  label: string;
  icon: React.ReactNode;
  badge?: number;
  onReset?: () => void;
  resetLabel?: string;
  children: React.ReactNode;
}

function CollapsedFilter({
  label,
  icon,
  badge,
  onReset,
  resetLabel,
  children,
}: CollapsedFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative size-8",
            badge ? "text-foreground" : "text-muted-foreground"
          )}
          title={label}
          aria-label={label}
        >
          {icon}
          {badge ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium leading-none text-primary-foreground">
              {badge}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-64 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-medium">{label}</span>
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={onReset}
              aria-label={resetLabel ?? `Retirer ${label}`}
            >
              <X className="mr-1 size-3" /> Retirer
            </Button>
          )}
        </div>
        <div className="p-2">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

function PlanningFiltersFallback() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Filtres</SidebarGroupLabel>
      <SidebarGroupContent className="space-y-3">
        <Skeleton className="h-64 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

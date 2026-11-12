// src/components/teacher/planning/TeacherPersonalPlanning.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { addHours } from "date-fns/addHours";
import { format } from "date-fns/format";
import { isBefore } from "date-fns/isBefore";
import { isSameDay } from "date-fns/isSameDay";
import { setHours } from "date-fns/setHours";
import { setMinutes } from "date-fns/setMinutes";
import { startOfDay } from "date-fns/startOfDay";
import { fr } from "date-fns/locale";

import { Calendar, type DayDecoration } from "@/components/ui/custom/calendar";
import type { ScheduleEvent } from "@/components/event-calendar";
import { DefaultStartHour, EndHour } from "@/components/event-calendar/constants";
import { usePlanningEvents } from "@/components/planning/hook/usePlanningEvents";
import { NO_TEACHER } from "@/components/planning/types";
import { mapScheduleToEvent } from "@/components/planning/utils";
import type { PlanningResources } from "@/services/planning";
import type { GetSchedulesDto } from "@/services/schedule";
import { usePlanningMonth } from "@/hooks/data/planning/use-planning-month";
import {
  planningResourcesQuery,
  planningSchedulesQuery,
} from "@/services/planning/queries";

import { PersonalPlanningDrawer } from "./ui/PersonalPlanningDrawer";
import { TeacherPlanningPreview } from "./ui/TeacherPlanningPreview";
import { TeacherPlanningEdit } from "./ui/TeacherPlanningEdit";

type Resources = NonNullable<PlanningResources>;

type DrawerView = { kind: "day" } | { kind: "session"; event: ScheduleEvent };

const EMPTY: GetSchedulesDto = []; // référence stable

// Référence stable utilisée pendant le chargement des ressources d'une classe.
// À ajuster si PlanningResources contient d'autres champs obligatoires.
const EMPTY_RESOURCES = { courses: [], rooms: [], groups: [] } as unknown as Resources;

const HAS_SCHEDULE_DECORATION: DayDecoration = {
  fillClassName: "bg-primary/10",
  ringClassName: "ring-2 ring-primary/80",
};

/**
 * Calcule l'heure de début par défaut pour une nouvelle séance :
 * - Si le jour est aujourd'hui, commence au plus tôt à l'heure suivante (ou DefaultStartHour).
 * - S'il y a des séances existantes, démarre après la fin de la dernière séance (ou au premier trou disponible).
 * - Empêche de démarrer pile sur la fin d'un créneau existant pour éviter les conflits d'horaires immédiats.
 */
export function buildDraftEvent(
  day: Date,
  classId: string,
  teacherId: string | undefined,
  resources: Resources,
  existingEventsOrNow?: ScheduleEvent[] | Date,
  maybeNow?: Date
): ScheduleEvent | null {
  const existingEvents: ScheduleEvent[] = Array.isArray(existingEventsOrNow) ? existingEventsOrNow : [];
  const now: Date = existingEventsOrNow instanceof Date ? existingEventsOrNow : (maybeNow ?? new Date());

  if (isBefore(day, startOfDay(now))) return null;

  let startMinutes = (isSameDay(day, now)
    ? Math.max(DefaultStartHour, now.getHours() + 1)
    : DefaultStartHour) * 60;

  if (existingEvents.length > 0) {
    // Calcul de la fin maximale parmi les séances du jour
    for (const e of existingEvents) {
      const eEnd = new Date(e.end);
      const minutesEnd = eEnd.getHours() * 60 + eEnd.getMinutes();
      if (minutesEnd > startMinutes) {
        startMinutes = minutesEnd;
      }
    }
  }

  const startHour = Math.floor(startMinutes / 60);
  const startMinute = startMinutes % 60;

  if (startHour + 1 > EndHour) return null;

  const start = setMinutes(setHours(startOfDay(day), startHour), startMinute);
  return {
    id: "",
    title: "",
    start,
    end: addHours(start, 1),
    meta: {
      classId,
      courseId: resources.courses.length === 1 ? resources.courses[0].id : "",
      teacherId: teacherId ?? NO_TEACHER,
      roomId: resources.rooms.length === 1 ? resources.rooms[0].id : undefined,
      groupId: undefined,
      status: "PENDING",
      confirmed: true,
      isLocked: false,
    },
  };
}

/**
 * Planning d'un prof en organisation personnelle.
 * Calendrier (ui/custom/calendar) scopé par teacherId + drawer du jour avec switch aperçu/édition.
 * La classe active vit en état local ; l'URL (?classId=) est synchronisée via
 * history.replaceState, sans rerender serveur. Les ressources (cours, salles, groupes)
 * sont chargées par classe via TanStack Query.
 */
export function TeacherPersonalPlanning({
  classId,
  teacherId,
  classes = [],
}: {
  classId: string;
  teacherId?: string;
  classes?: Array<{ id: string; name: string }>;
}) {
  const queryClient = useQueryClient();
  const [activeClassId, setActiveClassId] = useState(classId);

  const [visibleMonth, setVisibleMonth] = usePlanningMonth();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<DrawerView>({ kind: "day" });

  // Les ressources suivent la classe de la séance ouverte, sinon la classe active.
  const resourcesClassId =
    view.kind === "session" ? view.event.meta.classId || activeClassId : activeClassId;

  const { data: resources, isPending: resourcesLoading } = useQuery(
    planningResourcesQuery(resourcesClassId),
  );

  const { data: monthSchedules = EMPTY } = useQuery({
    ...planningSchedulesQuery({ date: format(visibleMonth, "yyyy-MM-dd"), teacherId }),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  const initialEvents = useMemo(
    () => monthSchedules.map(mapScheduleToEvent),
    [monthSchedules]
  );

  const getConflictResources = useCallback(
    () => queryClient.ensureQueryData(planningResourcesQuery(resourcesClassId)),
    [queryClient, resourcesClassId]
  );

  const { events, onEventAdd, onEventUpdate, onEventDelete } = usePlanningEvents({
    initialEvents,
    classId: activeClassId,
    getConflictResources,
  });

  const scheduledDays = useMemo(
    () => new Set(events.map((e) => format(e.start, "yyyy-MM-dd"))),
    [events]
  );

  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => isSameDay(e.start, selectedDate))
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events, selectedDate]
  );

  const dayDecoration = useCallback(
    (date: Date) => (scheduledDays.has(format(date, "yyyy-MM-dd")) ? HAS_SCHEDULE_DECORATION : undefined),
    [scheduledDays]
  );

  const draft = useMemo(
    () =>
      resources
        ? buildDraftEvent(selectedDate, activeClassId, teacherId, resources, dayEvents)
        : null,
    [selectedDate, activeClassId, teacherId, resources, dayEvents]
  );

  const openDay = useCallback((date: Date) => {
    if (!date) return;
    setSelectedDate(startOfDay(date));
    setView({ kind: "day" });
    setDrawerOpen(true);
  }, []);

  const backToDay = useCallback(() => setView({ kind: "day" }), []);

  const handleClassChange = useCallback((nextClassId: string) => {
    setActiveClassId(nextClassId);
    setView((current) => {
      if (current.kind !== "session" || current.event.id) return current;

      return {
        kind: "session",
        event: {
          ...current.event,
          meta: {
            ...current.event.meta,
            classId: nextClassId,
            courseId: "",
            roomId: undefined,
            groupId: undefined,
          },
        },
      };
    });

    // Met à jour l'URL sans rerender serveur.
    const url = new URL(window.location.href);
    url.searchParams.set("classId", nextClassId);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, []);

  const handleSave = useCallback(
    async (event: ScheduleEvent) => {
      const ok = event.id
        ? await onEventUpdate(event, "form")
        : await onEventAdd(event);
      if (ok) void queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
    [onEventAdd, onEventUpdate, queryClient]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (await onEventDelete(id)) {
        backToDay();
        void queryClient.invalidateQueries({ queryKey: ["schedules"] });
      }
    },
    [onEventDelete, backToDay, queryClient]
  );

  return (
    <div className="flex w-full flex-1 flex-col gap-4">
      <div className="flex w-full flex-1 flex-col">
        <Calendar
          mode="single"
          required
          month={visibleMonth}
          onMonthChange={setVisibleMonth}
          selected={selectedDate}
          onSelect={openDay}
          dayDecoration={dayDecoration}
          locale={fr}
          todayLabel="Auj."
          classNames={{ root: "w-full" }}
          className="mx-auto h-145 gap-3 p-2"
        />

        
        <PersonalPlanningDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={format(selectedDate, "EEEE d MMMM", { locale: fr })}
          description="Séances du jour"
        >
          {view.kind === "day" ? (
            <TeacherPlanningPreview
              date={selectedDate}
              events={dayEvents}
              onSelect={(event) => setView({ kind: "session", event })}
              onAdd={draft ? () => setView({ kind: "session", event: draft }) : undefined}
            />
          ) : (
            <TeacherPlanningEdit
              key={view.event.id || "draft"}
              event={view.event}
              classId={resourcesClassId}
              onClassChange={handleClassChange}
              classes={classes}
              teacherId={teacherId}
              resources={resources ?? EMPTY_RESOURCES}
              resourcesLoading={resourcesLoading}
              onBack={backToDay}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}
        </PersonalPlanningDrawer>
      </div>
    </div>
  );
}
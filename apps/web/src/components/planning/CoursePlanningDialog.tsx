"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { differenceInMinutes, format } from "date-fns";
import { fr } from "date-fns/locale";

import type { EventDialogRendererProps } from "@/components/event-calendar";
import { EndHour, StartHour } from "@/components/event-calendar/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAvailability } from "@/hooks/data/planning/useAvailability";
import { isSlotElapsed } from "@/services/planning/policy";
import type { PlanningResources } from "@/services/planning";

import { CourseECard } from "./card/CourseEcard";
import { CoursePCard } from "./card/CoursePcard";
import { CourseRCard } from "./card/CourseRcard";
import {
  buildAllTeachersMap,
  buildCourseMap,
  buildCourseSelectOptions,
  buildRoomMap,
  buildRoomSelectOptions,
  buildScheduleEventFromForm,
  buildTeacherCardItems,
  buildTimeOptions,
  buildUseAvailabilityParams,
  computeSlotFromFormTimes,
  getInitialCoursePlanningFormState,
  resolveTimeUpdateAgainstGrid,
  validateScheduleForSave,
} from "./coursePlanning";

import type { DialogMode } from "./ui/PlanningToolbar";
import { PlanningToolbar } from "./ui/PlanningToolbar";
import type {
  CoursePlanningCardUpdatePatch,
  CoursePlanningFormState,
  TimeOption,
  TimeValue,
} from "./types";
import { NO_GROUP, NO_TEACHER } from "./types";

const TIME_OPTIONS: TimeOption[] = buildTimeOptions(StartHour, EndHour);

export type CoursePlanningDialogProps = EventDialogRendererProps & {
  classId: string;
  resources: NonNullable<PlanningResources>;
};

export function CoursePlanningDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  classId,
  resources,
}: CoursePlanningDialogProps) {
  const [form, setForm] = useState<CoursePlanningFormState>(() =>
    getInitialCoursePlanningFormState(event)
  );

  const [mode, setMode] = useState<DialogMode>(event?.id ? "view" : "edit");
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    setForm(getInitialCoursePlanningFormState(event));
    setMode(event?.id ? "view" : "edit");
    setLocked(!event?.id);
    setError(null);
  }, [event]);

  const isCreation = !event?.id;
  const isElapsedSlot = useMemo(
    () => (event ? isSlotElapsed(event) : false),
    [event],
  );
  const blockedCreation = isOpen && isCreation && isElapsedSlot;

  const patchForm = useCallback((patch: Partial<CoursePlanningFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const slot = useMemo(
    () => computeSlotFromFormTimes(form.startDate, form.startTime, form.endTime),
    [form.startDate, form.startTime, form.endTime]
  );

  const courseDuration = useMemo(
    () => (slot ? differenceInMinutes(slot.end, slot.start) / 60 : 0),
    [slot]
  );

  const filteredEndTimeOptions = useMemo(() => {
    const startIndex = TIME_OPTIONS.findIndex((t) => t.value === form.startTime);
    if (startIndex === -1) return TIME_OPTIONS;
    return TIME_OPTIONS.slice(startIndex + 1);
  }, [form.startTime]);

  const formattedDate = useMemo(
    () => format(form.startDate, "eeee d MMMM yyyy", { locale: fr }),
    [form.startDate]
  );

  const courseMap = useMemo(() => buildCourseMap(resources.courses), [resources.courses]);
  const roomMap = useMemo(() => buildRoomMap(resources.rooms), [resources.rooms]);
  const allTeachersMap = useMemo(() => buildAllTeachersMap(resources.courses), [resources.courses]);

  const availabilityInput = useMemo(
    () => buildUseAvailabilityParams({
      form,
      classId,
      resources,
      excludeScheduleId: event?.id,
    }),
    [form, classId, resources, event?.id]
  );

  const { isChecking: isCheckingAvailability, isRoomAvailable, isTeacherAvailable } =
    useAvailability({
      start: availabilityInput.start,
      end: availabilityInput.end,
      excludeScheduleId: availabilityInput.excludeScheduleId,
      rooms: availabilityInput.rooms,
      teachers: availabilityInput.teachers,
      classes: availabilityInput.classes,
      groups: availabilityInput.groups,
    });

  const courseOptions = useMemo(() => buildCourseSelectOptions(resources.courses), [resources.courses]);
  const roomOptions = useMemo(() => buildRoomSelectOptions(resources.rooms, isRoomAvailable), [resources.rooms, isRoomAvailable]);

  const selectedCourse = courseMap.get(form.courseId);

  const teacherOptions = useMemo(
    () => buildTeacherCardItems(selectedCourse?.teachers ?? [], isTeacherAvailable, courseDuration),
    [selectedCourse, isTeacherAvailable, courseDuration]
  );

  const display = useMemo(() => {
    const course = courseMap.get(form.courseId);
    const room = roomMap.get(form.roomId);
    const teacher = form.teacherId !== NO_TEACHER ? allTeachersMap.get(form.teacherId) : null;

    return {
      courseName: course?.name ?? "—",
      roomName: room?.name ?? "—",
      date: formattedDate,
      teacher: teacher ? {
        id: teacher.id,
        name: teacher.name ?? teacher.email ?? null,
        avatarUrl: teacher.avatar_url ?? null,
      } : null,
    };
  }, [courseMap, roomMap, form.courseId, form.roomId, form.teacherId, formattedDate, allTeachersMap]);

  const tryBuildEvent = useCallback(
    (statusOverride?: CoursePlanningFormState["status"]) => {
      const validation = validateScheduleForSave(form, slot);
      if (!validation.ok) return { ok: false as const, message: validation.message };
      return buildScheduleEventFromForm({
        form,
        slot: validation.slot,
        eventId: event?.id,
        classId,
        courseMap,
        roomMap,
        statusOverride,
      });
    },
    [form, slot, event?.id, courseMap, roomMap]
  );

  const handleSubmit = useCallback(async () => {
    setError(null);
    const built = tryBuildEvent();
    if (!built.ok) {
      setError(built.message);
      return;
    }
    setSaving(true);
    try {
      await onSave(built.event);
      setMode("view");
      onClose();
    } catch {
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }, [tryBuildEvent, onSave, onClose]);

  const handleCancel = useCallback(async () => {
    setCanceling(true);
    try {
      const built = tryBuildEvent("CANCELED");
      if (!built.ok) {
        setError(built.message);
        return;
      }
      await onSave(built.event);
      patchForm({ status: "CANCELED" });
      setMode("view");
    } catch {
      setError("Erreur lors de l'annulation.");
    } finally {
      setCanceling(false);
    }
  }, [tryBuildEvent, onSave, patchForm]);

  const handleRemove = useCallback(async () => {
    if (!event?.id) return;
    setDeleting(true);
    try {
      await onDelete(event.id);
    } catch {
      setError("Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  }, [event?.id, onDelete]);

  const handleCardUpdate = useCallback(
    (data: CoursePlanningCardUpdatePatch) => {
      const resolved = resolveTimeUpdateAgainstGrid(data, form.endTime, TIME_OPTIONS);

      setForm((prev) => {
        const next: Partial<CoursePlanningFormState> = {};

        if (resolved.startTime) {
          next.startTime = resolved.startTime as TimeValue;
          const startIndex = TIME_OPTIONS.findIndex((t) => t.value === resolved.startTime);
          const endIndex = TIME_OPTIONS.findIndex((t) => t.value === prev.endTime);

          if (endIndex <= startIndex) {
            const newEndIndex = Math.min(startIndex + 2, TIME_OPTIONS.length - 1);
            next.endTime = TIME_OPTIONS[newEndIndex].value as TimeValue;
          }
        }

        if (resolved.endTime) next.endTime = resolved.endTime as TimeValue;
        if (resolved.date) next.startDate = resolved.date;

        if (resolved.courseId) {
          next.courseId = resolved.courseId;
          if (resolved.courseId !== prev.courseId) next.teacherId = NO_TEACHER;
        }

        if (resolved.roomId) next.roomId = resolved.roomId;
        if (resolved.teacherId) next.teacherId = resolved.teacherId;

        return { ...prev, ...next };
      });
    },
    [form.endTime]
  );

  const handleLockToggle = useCallback(() => {
    setLocked((prev) => {
      const nextLocked = !prev;
      if (nextLocked && (mode === "notes" || mode === "group")) setMode("view");
      return nextLocked;
    });
  }, [mode]);

  const handleModeToggle = useCallback(
    (target: DialogMode) => {
      if (locked) return;
      setMode((prev) => (prev === target ? "view" : target));
    },
    [locked]
  );

  const isViewLike = mode === "view" || mode === "notes" || mode === "group";

  const coursesCount = resources.courses.length;
  const roomsCount = resources.rooms.length;
  const teachersCount = new Set(resources.courses.flatMap(c => c.teachers.map(t => t.id))).size;
  const isMissingResources = coursesCount === 0 || roomsCount === 0 || teachersCount === 0;

  return (
    <Dialog open={isOpen && !blockedCreation} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex flex-col border-0 gap-3 p-4 bg-transparent backdrop-blur-none shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">
          {event?.id ? "Modifier la séance" : "Nouvelle séance"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Gérer les informations de la séance de cours.
        </DialogDescription>

        {isViewLike && (
          <CoursePCard
            date={display.date}
            courseName={display.courseName}
            startTime={form.startTime}
            endTime={form.endTime}
            roomName={display.roomName}
            teacher={display.teacher}
            status={form.status}
          />
        )}

        {mode === "edit" && isMissingResources ? (
          <CourseRCard coursesCount={coursesCount} roomsCount={roomsCount} teachersCount={teachersCount} />
        ) : mode === "edit" && (
          <CourseECard
            key={event?.id ?? "new-session"}
            startDate={form.startDate}
            courseId={form.courseId}
            courseOptions={courseOptions}
            startTime={form.startTime}
            endTime={form.endTime}
            timeOptions={{
              start: TIME_OPTIONS,
              end: filteredEndTimeOptions,
            }}
            roomId={form.roomId}
            roomOptions={roomOptions}
            teacherId={form.teacherId}
            teacherOptions={teacherOptions}
            courseDuration={courseDuration}
            isCheckingAvailability={isCheckingAvailability}
            onUpdate={handleCardUpdate}
          />
        )}

        {mode === "notes" && (
          <div className="rounded-sm border border-border bg-card p-3 flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Notes de séance</span>
            <Textarea
              value={form.notes}
              onChange={(e) => patchForm({ notes: e.target.value })}
              rows={3}
              placeholder="Consigne du Cours"
              className="resize-none text-sm bg-transparent border-border/60 focus-visible:ring-1"
            />
          </div>
        )}

        {mode === "group" && (
          <div className="rounded-sm border border-border bg-card p-3 flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Groupe assigné</span>
            <Select value={form.groupId} onValueChange={(v) => patchForm({ groupId: v })}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Toute la classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_GROUP}>Toute la classe</SelectItem>
                {resources.groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-sm bg-destructive/15 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <PlanningToolbar
          mode={mode}
          locked={locked}
          saving={saving}
          canceling={canceling}
          deleting={deleting}
          hasEvent={!!event?.id}
          status={form.status}
          isElapsed={isElapsedSlot}
          onModeToggle={handleModeToggle}
          onLockToggle={handleLockToggle}
          onCancel={handleCancel}
          onRemove={handleRemove}
          onSubmit={handleSubmit}
          onCancelEdit={() => {
            setForm(getInitialCoursePlanningFormState(event));
            setError(null);
            setMode("view");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

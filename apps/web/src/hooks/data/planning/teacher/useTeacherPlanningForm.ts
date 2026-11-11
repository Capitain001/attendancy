// src/hooks/data/planning/teacher/useTeacherPlanningForm.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ScheduleEvent } from "@/components/event-calendar";
import { EndHour, StartHour } from "@/components/event-calendar/constants";
import {
  buildCourseMap,
  buildRoomMap,
  buildScheduleEventFromForm,
  buildTimeOptions,
  computeSlotFromFormTimes,
  NO_GROUP,
  NO_TEACHER,
  resolveTimeUpdateAgainstGrid,
  validateScheduleForSave,
  type TimeOption,
} from "@/components/planning/coursePlanning";
import type { CoursePlanningFormState, TimeValue } from "@/components/planning/types";
import type { PlanningResources } from "@/services/planning";
import {
  computeSlotDurationMinutes,
  resolveTeacherDialogDefaultForm,
} from "@/components/teacher/planning/utils";

export const TIME_OPTIONS: TimeOption[] = buildTimeOptions(StartHour, EndHour);

export function useTeacherPlanningForm(params: {
  event: ScheduleEvent | null;
  isOpen: boolean;
  classId: string;
  teacherId?: string;
  resources: NonNullable<PlanningResources>;
  onClose: () => void;
  onSave: (event: ScheduleEvent) => void | Promise<void>;
  onDelete: (eventId: string) => void | Promise<void>;
}) {
  const { event, isOpen, classId, teacherId, resources, onClose, onSave, onDelete } = params;

  const courseMap = useMemo(() => buildCourseMap(resources.courses), [resources.courses]);
  const roomMap = useMemo(() => buildRoomMap(resources.rooms), [resources.rooms]);

  const resolveDefaultForm = useCallback(
    (target: ScheduleEvent | null): CoursePlanningFormState =>
      resolveTeacherDialogDefaultForm({ event: target, resources, teacherId }),
    [resources, teacherId]
  );

  const [form, setForm] = useState<CoursePlanningFormState>(() => resolveDefaultForm(event));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(resolveDefaultForm(event));
    setError(null);
  }, [isOpen, event, resolveDefaultForm]);

  const slot = useMemo(
    () => computeSlotFromFormTimes(form.startDate, form.startTime, form.endTime),
    [form.startDate, form.startTime, form.endTime]
  );

  const durationMinutes = useMemo(() => computeSlotDurationMinutes(slot), [slot]);

  const filteredEndTimeOptions = useMemo(() => {
    const startIndex = TIME_OPTIONS.findIndex((t) => t.value === form.startTime);
    if (startIndex === -1) return TIME_OPTIONS;
    return TIME_OPTIONS.slice(startIndex + 1);
  }, [form.startTime]);

  const handleStartTimeChange = useCallback((nextStart: string) => {
    setForm((prev) => {
      const resolved = resolveTimeUpdateAgainstGrid(
        { startTime: nextStart as TimeValue },
        prev.endTime,
        TIME_OPTIONS
      );
      return {
        ...prev,
        startTime: (resolved.startTime ?? nextStart) as TimeValue,
        endTime: (resolved.endTime ?? prev.endTime) as TimeValue,
      };
    });
  }, []);

  const handleEndTimeChange = useCallback((nextEnd: string) => {
    setForm((prev) => ({ ...prev, endTime: nextEnd as TimeValue }));
  }, []);

  const handleCourseChange = useCallback(
    (nextCourseId: string) => {
      setForm((prev) => {
        const courseTeachers = courseMap.get(nextCourseId)?.teachers ?? [];
        const nextTeacherId =
          teacherId ??
          courseTeachers[0]?.id ??
          (prev.teacherId !== NO_TEACHER ? prev.teacherId : NO_TEACHER);
        return {
          ...prev,
          courseId: nextCourseId,
          teacherId: nextTeacherId,
        };
      });
    },
    [courseMap, teacherId]
  );

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
    [form, slot, event?.id, classId, courseMap, roomMap]
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
      onClose();
    } catch {
      setError("Erreur lors de l'enregistrement de la séance.");
    } finally {
      setSaving(false);
    }
  }, [tryBuildEvent, onSave, onClose]);

  const handleCancelSchedule = useCallback(async () => {
    setError(null);
    const built = tryBuildEvent("CANCELED");
    if (!built.ok) {
      setError(built.message);
      return;
    }
    setCanceling(true);
    try {
      await onSave(built.event);
      onClose();
    } catch {
      setError("Erreur lors de l'annulation de la séance.");
    } finally {
      setCanceling(false);
    }
  }, [tryBuildEvent, onSave, onClose]);

  const handleRemove = useCallback(async () => {
    if (!event?.id) return;
    setError(null);
    setDeleting(true);
    try {
      await onDelete(event.id);
    } catch {
      setError("Erreur lors de la suppression de la séance.");
    } finally {
      setDeleting(false);
    }
  }, [event?.id, onDelete]);

  const selectedCourseName = courseMap.get(form.courseId)?.name ?? event?.title ?? "Cours";
  const selectedRoomName = roomMap.get(form.roomId)?.name ?? event?.location ?? "";
  const selectedGroupName =
    form.groupId !== NO_GROUP
      ? resources.groups.find((g) => g.id === form.groupId)?.name
      : undefined;

  return {
    form,
    setForm,
    slot,
    error,
    saving,
    canceling,
    deleting,
    isBusy: saving || canceling || deleting,
    durationMinutes,
    filteredEndTimeOptions,
    courseMap,
    roomMap,
    selectedCourseName,
    selectedRoomName,
    selectedGroupName,
    handleStartTimeChange,
    handleEndTimeChange,
    handleCourseChange,
    handleSubmit,
    handleCancelSchedule,
    handleRemove,
  };
}


"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { ScheduleEvent, ScheduleUpdateSource } from "@/components/event-calendar";
import { ERRORS } from "@/config";
import {
  createScheduleAction,
  deleteScheduleAction,
  updateScheduleAction,
  restoreScheduleAction,
} from "@/services/schedule/actions";
import { checkConflictsAction } from "@/services/planning/conflict/actions";
import type { ConflictResources } from "../conflictsToast";
import { diff } from "@/lib/utils";

import { mapScheduleToEvent } from "../utils";
import { toastScheduleConflict } from "../conflictsToast";
import { NO_TEACHER } from "../types";

type ConfirmMoveFn = (previous: ScheduleEvent | null, next: ScheduleEvent) => Promise<boolean>;

export interface UsePlanningEventsOptions {
  initialEvents: ScheduleEvent[];
  classId?: string;
  getConflictResources?: (classId: string) => Promise<ConflictResources | null>;
  confirmMove?: ConfirmMoveFn;
  onAdd?: (event: ScheduleEvent) => Promise<boolean>;
}

type ConflictDetailsParams = Parameters<typeof checkConflictsAction>[0];

type ValidatedEvent = ScheduleEvent & {
  meta: ScheduleEvent["meta"] & { roomId: string };
};

function validateMeta(e: ScheduleEvent): e is ValidatedEvent {
  if (!e.meta.courseId || !e.meta.roomId) {
    toast.error("Le cours et la salle sont obligatoires.");
    return false;
  }
  if (!e.meta.teacherId || e.meta.teacherId === NO_TEACHER) {
    toast.error("L'enseignant est obligatoire.");
    return false;
  }
  return true;
}

const UNDO_DURATION_MS = 6000;

export function usePlanningEvents(opts: UsePlanningEventsOptions) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const { initialEvents } = opts;
  const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents);
  const eventsRef = useRef<ScheduleEvent[]>(initialEvents);
  const undoToastId = useRef<string | number | null>(null);

  useEffect(() => { setEvents(initialEvents); }, [initialEvents]);
  useEffect(() => { eventsRef.current = events; }, [events]);

  const notifyConflict = useCallback(
    async (classId: string, detailsParams: ConflictDetailsParams) => {
      const { getConflictResources } = optsRef.current;
      if (getConflictResources) {
        const resources = await getConflictResources(classId);
        if (resources) {
          toastScheduleConflict({
            message: ERRORS.SCHEDULE.CONFLICT_MESSAGE,
            resources,
            loadDetails: () => checkConflictsAction(detailsParams),
          });
          return;
        }
      }
      toast.error(ERRORS.SCHEDULE.CONFLICT_MESSAGE);
    },
    []
  );

  const armUndoToast = useCallback(
    (message: string, onUndo: () => void, extra?: { label: string; onClick: () => void }) => {
      if (undoToastId.current !== null) toast.dismiss(undoToastId.current);
      undoToastId.current = toast(message, {
        duration: UNDO_DURATION_MS,
        action: { label: "Annuler", onClick: onUndo },
        ...(extra ? { cancel: extra } : {}),
      });
    },
    []
  );

  const commitUpdate = useCallback(
    async (e: ScheduleEvent, { isUndo, source }: { isUndo: boolean; source?: ScheduleUpdateSource }): Promise<boolean> => {
      if (!e.id || !validateMeta(e)) return false;
      const classId = e.meta.classId;
      if (!classId) { toast.error("Classe introuvable."); return false; }

      const { courseId, teacherId, roomId, groupId } = e.meta;
      const previous = eventsRef.current.find((x) => x.id === e.id) ?? null;
      setEvents((prev) => prev.map((x) => (x.id === e.id ? e : x)));

      const detailsParams: ConflictDetailsParams = {
        occurrences: [{ startTime: new Date(e.start), endTime: new Date(e.end), courseId, teacherId, roomId, classId, groupId }],
        excludeScheduleId: e.id,
      };

      const checked = await checkConflictsAction(detailsParams);
      if (checked.error || (checked.data && checked.data.conflicts.length > 0)) {
        if (previous) setEvents((prev) => prev.map((x) => (x.id === e.id ? previous : x)));
        await notifyConflict(classId, detailsParams);
        return false;
      }

      const { confirmMove } = optsRef.current;
      if (!isUndo && source === "dnd" && confirmMove) {
        const confirmed = await confirmMove(previous, e);
        if (!confirmed) {
          if (previous) setEvents((prev) => prev.map((x) => (x.id === e.id ? previous : x)));
          return false;
        }
      }

      const updatedPayload = {
        courseId, teacherId, roomId,
        startTime: new Date(e.start), endTime: new Date(e.end),
        groupId: groupId ?? null, notes: e.description ?? null,
        confirmed: e.meta.confirmed ?? false, status: e.meta.status ?? "PENDING",
      };
      const initialPayload = previous ? {
        courseId: previous.meta.courseId, teacherId: previous.meta.teacherId, roomId: previous.meta.roomId,
        startTime: new Date(previous.start), endTime: new Date(previous.end),
        groupId: previous.meta.groupId ?? null, notes: previous.description ?? null,
        confirmed: previous.meta.confirmed ?? false, status: previous.meta.status ?? "PENDING",
      } : undefined;

      const changedData = diff(updatedPayload, initialPayload);
      if (Object.keys(changedData).length === 0) return true;

      const res = await updateScheduleAction(e.id, changedData);
      if (res.error || !res.data) {
        if (previous) setEvents((prev) => prev.map((x) => (x.id === e.id ? previous : x)));
        if (res.error === ERRORS.SCHEDULE.CONFLICT) { await notifyConflict(classId, detailsParams); return false; }
        toast.error(res.error ?? "Mise à jour impossible.");
        return false;
      }

      setEvents((prev) => prev.map((x) => (x.id === e.id ? mapScheduleToEvent(res.data as never) : x)));

      if (isUndo) {
        toast.success("Modification annulée.");
      } else if (previous) {
        armUndoToast("Séance modifiée.", () => { void commitUpdate(previous, { isUndo: true }); });
      } else {
        toast.success("Séance modifiée.");
      }
      return true;
    },
    [notifyConflict, armUndoToast]
  );

  const onEventUpdate = useCallback(
    (e: ScheduleEvent, source: ScheduleUpdateSource) => commitUpdate(e, { isUndo: false, source }),
    [commitUpdate]
  );

  const onEventAdd = useCallback(async (e: ScheduleEvent): Promise<boolean> => {
    const { onAdd, classId } = optsRef.current;
    if (onAdd) return onAdd(e);
    if (!validateMeta(e)) return false;
    if (!classId) { toast.error("Classe introuvable."); return false; }

    const { courseId, teacherId, roomId, groupId } = e.meta;
    const res = await createScheduleAction({
      courseId, teacherId, roomId, classId,
      startTime: new Date(e.start), endTime: new Date(e.end),
      groupId: groupId ?? null, notes: e.description ?? null,
      confirmed: e.meta.confirmed ?? false, status: e.meta.status ?? "PENDING",
    });

    if (res.error || !res.data) {
      if (res.error === ERRORS.SCHEDULE.CONFLICT) {
        await notifyConflict(classId, {
          occurrences: [{ startTime: new Date(e.start), endTime: new Date(e.end), courseId, teacherId, roomId, classId, groupId }],
        });
        return false;
      }
      toast.error(res.error ?? "Création impossible.");
      return false;
    }

    const created = mapScheduleToEvent(res.data as never);
    setEvents((prev) => [...prev, created]);
    armUndoToast("Séance créée.", () => {
      void (async () => {
        const del = await deleteScheduleAction(created.id);
        if (!del.error) { setEvents((prev) => prev.filter((x) => x.id !== created.id)); toast.success("Création annulée."); }
        else toast.error(del.error ?? "Annulation impossible.");
      })();
    });
    return true;
  }, [notifyConflict, armUndoToast]);

  const onEventDelete = useCallback(async (id: string): Promise<boolean> => {
    const res = await deleteScheduleAction(id);
    if (res.error) { toast.error(res.error ?? "Suppression impossible."); return false; }
    setEvents((prev) => prev.filter((x) => x.id !== id));
    armUndoToast("Séance supprimée.", () => {
      void (async () => {
        const restored = await restoreScheduleAction(id);
        if ("data" in restored && restored.data) {
          setEvents((prev) => [...prev, mapScheduleToEvent(restored.data as never)]);
          toast.success("Suppression annulée.");
        } else {
          toast.error(("error" in restored && restored.error) || "Restauration impossible.");
        }
      })();
    });
    return true;
  }, [armUndoToast]);

  return { events, setEvents, onEventAdd, onEventUpdate, onEventDelete };
}

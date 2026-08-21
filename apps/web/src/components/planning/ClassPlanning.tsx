"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/lib/toast/custom-toast";

import type { EventDialogRendererProps, ScheduleEvent } from "@/components/event-calendar";
import { EventCalendar } from "@/components/event-calendar";

import {
  buildScheduleMoveToastContent,
  buildScheduleMoveChange,
  mapScheduleToEvent,
  type ScheduleMoveChange,
} from "./utils";
import { isSlotElapsed } from "@/services/planning/policy";
import type { PlanningResources } from "@/services/planning";
import type { GetSchedulesReturn } from "@/services/schedule";
import { ActionScheduleToast } from "./ui/ActionScheduleToast";
import { useActionConfirm } from "./hook/useActionConfirm";
import { usePlanningEvents } from "./hook/usePlanningEvents";
import { PlanningExportWidget } from "./export/PlanningExportWidget";

const CoursePlanningDialog = dynamic(
  () => import("./CoursePlanningDialog").then((m) => m.CoursePlanningDialog),
  { ssr: false }
);

export type ClassPlanningClientProps = {
  slug: string;
  classId: string;
  resources: NonNullable<PlanningResources>;
  schedules: GetSchedulesReturn;
};

const DEFAULT_MOVE_TOAST = {
  title: "Confirmer le déplacement ?",
  description: "Le cours sera déplacé à la nouvelle position.",
};

export function ClassPlanning({
  slug,
  classId,
  resources,
  schedules,
}: ClassPlanningClientProps) {
  const resourcesRef = useRef(resources);
  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  const { open, waitForConfirmation, onConfirm, onCancel, onClose } = useActionConfirm();
  const [confirmToastContent, setConfirmToastContent] = useState(DEFAULT_MOVE_TOAST);
  const [moveChange, setMoveChange] = useState<ScheduleMoveChange | undefined>(undefined);

  const initialEvents = useMemo(
    () => schedules.map((schedule) => mapScheduleToEvent(schedule)),
    [schedules]
  );

  const confirmMove = useCallback(
    async (previous: ScheduleEvent | null, next: ScheduleEvent) => {
      if (isSlotElapsed(next)) {
        toast.error("On ne déplace pas une séance dans le passé.");
        return false;
      }

      setConfirmToastContent(buildScheduleMoveToastContent(previous, next));
      setMoveChange(buildScheduleMoveChange(previous, next));
      const ok = await waitForConfirmation();
      setConfirmToastContent(DEFAULT_MOVE_TOAST);
      setMoveChange(undefined);
      return ok;
    },
    [waitForConfirmation]
  );

  const getConflictResources = useCallback(
    async (_classId: string) => resourcesRef.current ?? null,
    []
  );

  const { events, onEventAdd, onEventUpdate, onEventDelete } = usePlanningEvents({
    initialEvents,
    classId,
    confirmMove,
    getConflictResources,
  });

  const renderDialog = useCallback(
    (dialogProps: EventDialogRendererProps) => (
      <CoursePlanningDialog
        {...dialogProps}
        classId={classId}
        resources={resourcesRef.current}
      />
    ),
    [classId]
  );

  const title = useMemo(
    () => `Classe - ${resources.class?.name}`,
    [resources.class?.name]
  );

  const href = useMemo(
    () => `/${slug}/direction/classes/${classId}`,
    [slug, classId]
  );

  return (
    <div className="flex flex-col ">
      <ActionScheduleToast
        open={open}
        title={confirmToastContent.title}
        description={confirmToastContent.description}
        confirm={{ label: "Confirmer", onClick: onConfirm }}
        cancel={{ label: "Annuler", onClick: onCancel }}
        onClose={onClose}
      />

      <div className="mb-0 flex items-center justify-end">
        <PlanningExportWidget classId={classId} resources={resources} />
      </div>

      <EventCalendar
        href={href}
        title={title}
        events={events}
        onEventAdd={onEventAdd}
        onEventUpdate={onEventUpdate}
        onEventDelete={onEventDelete}
        renderEventDialog={renderDialog}
      />
    </div>
  );
}

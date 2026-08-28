"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CoursePCard } from "./CoursePcard";
// import type { ScheduleRow } from "../utils";
import { GetSchedulesDto } from "@/services/schedule/generated.types";

export type CoursePCardDialogProps = {
  schedule?: GetSchedulesDto[number];
  isOpen: boolean;
  onClose: () => void;
};

export function CoursePCardDialog({
  schedule,
  isOpen,
  onClose,
}: CoursePCardDialogProps) {
  if (!schedule) return null;

  const teacherName = schedule.teacher
    ? [schedule.teacher.user.firstName, schedule.teacher.user.lastName].filter(Boolean).join(" ")
    : undefined;
    
    const avatarUrl = schedule.teacher?.user.avatar_url || undefined

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-fit flex justify-center">
        <DialogTitle className="sr-only">Détails du cours {schedule.course.name}</DialogTitle>
        <CoursePCard
          date={format(schedule.startTime, "d MMMM yyyy", { locale: fr })}
          courseName={schedule.course.name}
          startTime={format(schedule.startTime, "HH:mm")}
          endTime={format(schedule.endTime, "HH:mm")}
          roomName={schedule.room.name || "Salle non assignée"}
          teacher={
            schedule.teacher
              ? { id: schedule.teacher.id, name: teacherName , avatarUrl  }
              : null
          }
          status={schedule.status}
        />
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Lock } from "lucide-react";

import { useTeacherDaySchedules } from "@/hooks/data/planning/useTeacherDaySchedules";
import { GetSchedulesDto } from "@/services/schedule/generated.types";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export type TeacherDaySchedulesSheetProps = {
  teacherId: string;
  selectedDate: Date | null;
  isOpen: boolean;
  onClose: () => void;
  initialTodaySchedules?: GetSchedulesDto;
};

const STATUS_LABEL: Record<GetSchedulesDto[number]["status"], string> = {
  PENDING: "À venir",
  COMPLETED: "Terminée",
  CANCELED: "Annulée",
  MISSED: "Manquée",
};

export function TeacherDaySchedulesSheet({
  teacherId,
  selectedDate,
  isOpen,
  onClose,
  initialTodaySchedules,
}: TeacherDaySchedulesSheetProps) {
  // Données déjà triées par startTime côté serveur (orderBy dans getTeacherSchedulesInfo) — pas de tri client nécessaire.
  const { data: daySchedules = [], isLoading } = useTeacherDaySchedules({
    teacherId,
    date: selectedDate ?? new Date(),
    initialTodaySchedules,
  });
  
  if (!selectedDate) return null;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DrawerContent className="mx-auto flex h-[80vh] max-w-lg flex-col bg-card text-teacher-fg">
        <DrawerHeader className="mb-4 text-left">
          <DrawerTitle className="text-xl font-bold text-teacher-fg">
            Séances du {format(selectedDate, "d MMMM yyyy", { locale: fr })}
          </DrawerTitle>
        </DrawerHeader>

        {isLoading ? (
          <div className="mx-6 flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-teacher-surface-muted text-xs text-teacher-muted">
            Chargement des séances…
          </div>
        ) : daySchedules.length === 0 ? (
          <div className="mx-6 flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-teacher-surface-muted text-xs text-teacher-muted">
            Aucune séance ce jour.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 pb-6">
            {daySchedules.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-teacher-surface p-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-teacher-fg">
                    {s.course.name}
                  </span>

                  <span className="text-xs text-teacher-muted">
                    {format(new Date(s.startTime), "HH:mm")} –{" "}
                    {format(new Date(s.endTime), "HH:mm")} · {s.room.name}
                  </span>

                  <span className="text-[11px] font-medium text-teacher-brand">
                    Classe : {s.class.name}{" "}
                    {s.group ? `(${s.group.name})` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {s.isLocked && (
                    <Lock className="h-3.5 w-3.5 text-teacher-muted" />
                  )}

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      s.status === "CANCELED"
                        ? "bg-teacher-surface-muted text-teacher-muted"
                        : "bg-teacher-inverted text-teacher-inverted-fg"
                    }`}
                  >
                    {STATUS_LABEL[s.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Clock,
  MapPin,
  BookOpen,
  Users,
  CheckCircle2,
} from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { GetSchedulesDto } from "@/services/schedule";

type ScheduleItem = GetSchedulesDto[number];

const STATUS_STYLES: Record<
  string,
  { label: string; className: string; bgClassName: string }
> = {
  PENDING: {
    label: "À venir",
    className: "text-amber-600 dark:text-amber-400",
    bgClassName: "bg-amber-500/10 border-amber-500/20",
  },
  COMPLETED: {
    label: "Terminée",
    className: "text-emerald-600 dark:text-emerald-400",
    bgClassName: "bg-emerald-500/10 border-emerald-500/20",
  },
  CANCELED: {
    label: "Annulée",
    className: "text-red-600 dark:text-red-400",
    bgClassName: "bg-red-500/10 border-red-500/20",
  },
  MISSED: {
    label: "Manquée",
    className: "text-orange-600 dark:text-orange-400",
    bgClassName: "bg-orange-500/10 border-orange-500/20",
  },
};

function getStatusStyle(status: string) {
  return (
    STATUS_STYLES[status] ?? {
      label: status,
      className: "text-muted-foreground",
      bgClassName: "bg-muted border-border",
    }
  );
}

interface TeacherPlanningDrawerProps {
  selectedDate: Date;
  schedules: ScheduleItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?:string;
}

export function TeacherPlanningDrawer({
  selectedDate,
  schedules,
  open,
  onOpenChange,
  className
}: TeacherPlanningDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>

      <DrawerContent className={cn("border rounded-2xl p-[0.2px] max-h-[85vh]", className )} >
        <div className="mx-auto w-full max-w-lg">
          {/* Header */}
          <DrawerHeader className="border-b pb-3 text-left">
            <DrawerTitle className="capitalize text-base font-semibold">
              {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              {schedules.length}{" "}
              {schedules.length > 1 ? "cours prévus" : "cours prévu"}
            </DrawerDescription>
          </DrawerHeader>

          {/* Liste des cours */}
          <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
            {schedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 stroke-1 mb-2 opacity-40" />
                <p className="text-sm font-medium">Aucun cours prévu</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Aucune séance programmée pour cette journée.
                </p>
              </div>
            ) : (
              schedules.map((schedule) => {
                const statusStyle = getStatusStyle(schedule.status);
                const startTimeStr = format(
                  new Date(schedule.startTime),
                  "HH:mm"
                );
                const endTimeStr = format(
                  new Date(schedule.endTime),
                  "HH:mm"
                );

                return (
                  <div
                    key={schedule.id}
                    className="flex flex-col gap-2.5 rounded-lg border bg-card p-3.5 text-sm transition-all"
                  >
                    {/* Horaire & Statut */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {startTimeStr} - {endTimeStr}
                        </span>
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          statusStyle.bgClassName,
                          statusStyle.className
                        )}
                      >
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* Cours */}
                    <div className="font-medium text-foreground text-base tracking-tight leading-snug">
                      {schedule.course?.name ?? "Cours sans nom"}
                    </div>

                    {/* Lieu & Classe */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">
                          {schedule.room?.name ?? "Salle N/A"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">
                          {schedule.group?.name
                            ? `${schedule.class?.name} (${schedule.group.name})`
                            : schedule.class?.name ?? "Classe N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Confirmation */}
                    {schedule.confirmed && (
                      <div className="flex items-center gap-1 pt-1 border-t text-[11px] text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Confirmé</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
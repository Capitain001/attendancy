"use client";

import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AttendanceList } from "../session/AttendanceList";
import { useAttendanceStats } from "@/hooks/data/attendances/use-attendance-stats";

interface AttendanceSectionProps {
  scheduleId: string;
  studentCount?: number;
  triggerClassName?: string;
  contentClassName?: string;
}

export function AttendanceSection({
  scheduleId,
  studentCount = 0,
  triggerClassName,
  contentClassName,
}: AttendanceSectionProps) {
  const { checkedCount, isStale } = useAttendanceStats(scheduleId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "group h-auto flex-col gap-1 rounded-xl bg-card px-5 py-3.5 hover:bg-muted/50",
            triggerClassName
          )}
        >
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            <Users className="size-3.5" />
            Étudiants
          </span>
          <span className="flex items-baseline gap-1">
            <span className="text-xl font-semibold leading-none tabular-nums text-foreground">
              {isStale ? "---" : checkedCount}
            </span>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              / {studentCount || "---"}
            </span>
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent
        className={cn(
          "flex h-[min(640px,85vh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg",
          contentClassName
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 space-y-0">
          <DialogTitle className="text-[13px] font-medium leading-none text-foreground">
            Liste de présences des étudiant
          </DialogTitle>
        </DialogHeader>
        <AttendanceList scheduleId={scheduleId} className="min-h-0 flex-1 rounded-none border-0" />
      </DialogContent>
    </Dialog>
  );
}

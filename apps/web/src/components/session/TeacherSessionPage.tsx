"use client"
import {
  CircleDashed,
} from "lucide-react";
import { useNextSchedule } from "@/hooks/data/sessions/useNextSchedule";
import SessionPageInner from "./section/SessionPageInner";

export default function TeacherSessionPage({ teacherId }: { teacherId: string }) {
  const { schedule, isLoading } = useNextSchedule({ teacherId });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <CircleDashed className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 text-muted-foreground">
        <CircleDashed className="size-8" />
        <span className="text-sm">Aucun cours à venir</span>
      </div>
    );
  }

  return <SessionPageInner schedule={schedule} teacherId={teacherId} />;
}
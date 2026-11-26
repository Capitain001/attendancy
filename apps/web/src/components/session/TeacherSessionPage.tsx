// src/components/session/TeacherSessionPage.tsx
"use client";

import { ChevronUp, CircleDashed } from "lucide-react";


import { AttendanceList } from "../session/AttendanceList";
import { useNextSchedule } from "@/hooks/data/sessions/useNextSchedule";
import SessionPageInner from "./section/SessionPageInner";
import { ScrollNavigator } from "@ui/components/navigation/scroll-navigator";

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

  return (
    <ScrollNavigator
      className="bg-background"
      panels={[
        <SessionPageInner key="session" schedule={schedule} teacherId={teacherId} />,
        <div key="attendance" className="flex h-full flex-col">
          <AttendanceList
            scheduleId={schedule.id}
            className="min-h-0 flex-1 rounded-none border-0 bg-background"
          />
        </div>,
      ]}
      // hint={
      //   <>
      //     <ChevronUp className="size-4 animate-bounce" />
      //     <span className="text-xs">Glisser pour les présences</span>
      //   </>
      // }
    />
  );
}
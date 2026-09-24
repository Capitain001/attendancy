"use client";

import { useState } from "react";
import { ChevronUp, CircleDashed } from "lucide-react";

import { SwipeNavigator } from "@/components/swipe-navigator";
import { AttendanceList } from "../session/AttendanceList";
import { useNextSchedule } from "@/hooks/data/sessions/useNextSchedule";
import SessionPageInner from "./section/SessionPageInner";

export default function TeacherSessionPage({ teacherId }: { teacherId: string }) {
  const [screen, setScreen] = useState(0);
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
    <SwipeNavigator
      value={screen}
      onValueChange={setScreen}
      panels={[
        <SessionPageInner key="session" schedule={schedule} teacherId={teacherId} />,
        // <div key="attendance" className="flex h-full flex-col overflow-hidden">
        //   <AttendanceList scheduleId={schedule.id} className="min-h-0 flex-1 rounded-none bg-background border-0" />
        // </div>,
      ]}
      hint={
        <>
          <ChevronUp className="size-4 animate-bounce" />
          <span className="text-xs">Glisser pour les présences</span>
        </>
      }
    />
  );
}
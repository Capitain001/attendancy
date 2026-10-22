"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";

import { SwipeNavigator } from "@/components/swipe-navigator";
import { TeacherDailyOverviewScreen } from "@/components/teacher/personal/screen/TeacherDailyOverviewScreen";
import TeacherDailyScheduleListScreen from "@/components/teacher/personal/screen/TeacherDailyScheduleListScreen";

export default function TeacherDailyScreen({ sessionsHref }: { sessionsHref?: string } = {}) {
  const [screen, setScreen] = useState(0);

  return (
    <SwipeNavigator
      value={screen}
      onValueChange={setScreen}
      panels={[
        <TeacherDailyOverviewScreen key="overview" sessionsHref={sessionsHref} />,
          <TeacherDailyScheduleListScreen key="list" />,
      ]}
      hint={
        <>
          <ChevronUp className="size-4 animate-bounce" />
          <span className="text-xs">Glisser pour la liste des cours</span>
        </>
      }
    />
  );
}
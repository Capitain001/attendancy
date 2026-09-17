"use client"

import { useState, type ComponentProps } from "react"
import { ChevronUp } from "lucide-react"

import { SwipeNavigator, type SwipeNavState } from "@/components/swipe-navigator"
import { TeacherScheduleCalendar } from "@/components/teacher/planning/TeacherScheduleCalendar"
import { DailyScheduleView } from "@/components/teacher/planning/DailyScheduleView"

interface TeacherPlanningScreenProps {
  teacherId: string
  initialSchedules: ComponentProps<typeof TeacherScheduleCalendar>["initialSchedules"]
  dailySchedules: ComponentProps<typeof DailyScheduleView>["schedules"]
}

export function TeacherPlanningScreen({
  teacherId,
  initialSchedules,
  dailySchedules,
}: TeacherPlanningScreenProps) {
  const [screen, setScreen] = useState<SwipeNavState>("main")

  return (
    <SwipeNavigator
      value={screen}
      onValueChange={setScreen}
      main={
        <div className="flex h-full flex-col overflow-hidden">
          <TeacherScheduleCalendar
            teacherId={teacherId}
            initialSchedules={initialSchedules}
          />
        </div>
      }
      secondary={
        <div className="flex h-full flex-col overflow-hidden">
          <DailyScheduleView schedules={dailySchedules} />
        </div>
      }
      hint={
        <>
          <ChevronUp className="h-4 w-4 animate-bounce" />
          <span className="text-xs">Glisser vers le haut pour la journée</span>
        </>
      }
    />
  )
}
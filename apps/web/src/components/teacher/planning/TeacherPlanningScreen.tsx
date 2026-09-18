"use client"

import { useState, type ComponentProps } from "react"
import { ChevronUp } from "lucide-react"

import { SwipeNavigator } from "@/components/swipe-navigator"
import { TeacherScheduleCalendar } from "@/components/teacher/planning/TeacherScheduleCalendar"
import { DailyScheduleView } from "@/components/teacher/planning/daily-schedule"

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
  const [screen, setScreen] = useState(0)

  return (
    <SwipeNavigator
      value={screen}
      onValueChange={setScreen}
      panels={[
        <div key="calendar" className="flex h-full flex-col overflow-hidden">
          <TeacherScheduleCalendar
            teacherId={teacherId}
            initialSchedules={initialSchedules}
          />
        </div>,
        <div key="daily" className="flex h-full flex-col overflow-hidden">
          <DailyScheduleView schedules={dailySchedules} />
        </div>,
      ]}
      hint={
        <>
          <ChevronUp className="h-4 w-4 animate-bounce" />
          <span className="text-xs">Glisser vers le haut pour la journée</span>
        </>
      }
    />
  )
}
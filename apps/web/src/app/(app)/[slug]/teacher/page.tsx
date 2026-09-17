import { getCurrentTeacherId } from "@/services/teacher/actions"
import {
  getTeacherSchedulesAction,
  getTeacherSchedulesInfoAction,
} from "@/services/schedule"
import { TeacherPlanningScreen } from "@/components/teacher/planning/TeacherPlanningScreen"

function getDayRange(date = new Date()) {
  const rangeStart = new Date(date)
  rangeStart.setHours(0, 0, 0, 0)

  const rangeEnd = new Date(date)
  rangeEnd.setHours(23, 59, 59, 999)

  return { rangeStart, rangeEnd }
}

export default async function Page() {
  const teacherId = await getCurrentTeacherId()

  if (!teacherId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Profil enseignant introuvable</p>
      </div>
    )
  }

  const { rangeStart, rangeEnd } = getDayRange()

  const [schedulesRes, dailyRes] = await Promise.all([
    getTeacherSchedulesAction({ teacherId, rangeStart, rangeEnd }),
    getTeacherSchedulesInfoAction({ teacherId, rangeStart, rangeEnd }),
  ])

  const schedules = "data" in schedulesRes ? (schedulesRes.data ?? []) : []
  const dailySchedules = "data" in dailyRes ? (dailyRes.data ?? []) : []

  return (
    <TeacherPlanningScreen
      teacherId={teacherId}
      initialSchedules={schedules}
      dailySchedules={dailySchedules}
    />
  )
}
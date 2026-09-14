import {
  getCurrentTeacherId,
} from "@/services/teacher/actions"
import { TeacherScheduleCalendar } from "@/components/teacher/planning/TeacherScheduleCalendar"
import { getTeacherSchedulesAction } from "@/services/schedule"

export default async function Page() {
  const teacherId = await getCurrentTeacherId()

  if (!teacherId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Profil enseignant introuvable</p>
      </div>
    )
  }

  const today = new Date()
  const rangeStart = new Date(today.setHours(0, 0, 0, 0))
  const rangeEnd = new Date(today.setHours(23, 59, 59, 999))

  const schedulesRes = await getTeacherSchedulesAction({
    teacherId,
    rangeStart,
    rangeEnd,
  })

  const schedules = "data" in schedulesRes ? (schedulesRes.data ?? []) : []

  return (
    <div className="scroll-smooth flex flex-1">
      <TeacherScheduleCalendar schedules={schedules} />
    </div>
  )
}
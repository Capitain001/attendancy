import { BookOpen } from "lucide-react"
import {
  getTeacherAction,
  getTeacherStatsAction,
  getTeacherTodaySchedulesAction,
  getTeacherCoursesAction,
  getCurrentTeacherId,
} from "@/services/teacher/actions"
import { DailyScheduleItem, TeacherDailyTimeline } from "./TeacherDailyTimeline"
import { TeacherProfileCard } from "@/components/teacher/ui/profile-card"


export default async function Page() {
  const teacherId = await getCurrentTeacherId()

  if (!teacherId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Profil enseignant introuvable</p>
      </div>
    )
  }

  const [teacherRes, statsRes, schedulesRes, coursesRes] = await Promise.all([
    getTeacherAction(teacherId),
    getTeacherStatsAction(teacherId),
    getTeacherTodaySchedulesAction(teacherId),
    getTeacherCoursesAction(teacherId),
  ])

  const teacher = "data" in teacherRes ? (teacherRes.data ?? null) : null
  const stats = "data" in statsRes ? (statsRes.data ?? null) : null
  const rawSched = "data" in schedulesRes ? (schedulesRes.data ?? []) : []
  const courses = "data" in coursesRes ? (coursesRes?.data ?? []) : []

  const schedules: DailyScheduleItem[] = rawSched.map((s) => ({
    id: s.id,
    // ISO : la timeline dérive le statut UI (PENDING/ONGOING/MISSED) depuis la date.
    start: s.startTime, // Date natif, transporté tel quel par RSC
    end: s.endTime,
    status: s.status,
    notes: s.notes,
    courseName: s.course.name,
    roomName: s.room.name,
  }))

  return (
    <div className="scroll-smooth flex flex-col gap-y-4 w-full mx-auto pb-10">

      {/* Profile + stats réels */}
      {teacher && stats && (
  <TeacherProfileCard teacher={teacher} stats={stats} />
)}

      {/* Agenda du jour réel */}
      <TeacherDailyTimeline schedules={schedules} />

      {/* Cours enseignés — nom en serif (accent teacher), surfaces douces */}
      {courses.length > 0 && (
        <div className="bg-card rounded-2xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
            Mes cours
          </p>
          <div className="space-y-1.5">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5 transition-colors hover:bg-accent/40"
              >
                <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-serif text-[15px] leading-snug truncate">{course.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}





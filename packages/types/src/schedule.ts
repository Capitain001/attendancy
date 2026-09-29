// DTOs planning — extraits des API routes (pas couplés à Prisma)
// Peupler depuis apps/web/app/api/planning/route.ts lors de Phase 4

export type ScheduleSlot = {
  id: string
  courseId: string
  courseName: string
  teacherId: string | null
  teacherName: string | null
  roomId: string | null
  roomName: string | null
  classId: string
  className: string
  startTime: string    // "HH:MM"
  endTime: string      // "HH:MM"
  dayOfWeek: number    // 0=lundi … 6=dimanche
  date: string | null  // ISO date si session ponctuelle
}

export type DayScheduleDto = {
  date: string
  dayOfWeek: number
  slots: ScheduleSlot[]
}

export type ScheduleDto = {
  classId: string
  className: string
  days: DayScheduleDto[]
}

export type ScheduleDbStatus = 'PENDING' | 'COMPLETED' | 'CANCELED' | 'MISSED'

export type TeacherScheduleItemDto = {
  id: string
  startTime: string // ISO
  endTime: string   // ISO
  status: ScheduleDbStatus
  notes: string | null
  isLocked: boolean
  courseName: string
  roomName: string
  className: string
  groupName: string | null
}

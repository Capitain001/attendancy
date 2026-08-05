export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export type SessionDto = {
  id: string
  status: SessionStatus
  startedAt: string   // ISO
  completedAt: string | null
  courseId: string
  courseName: string
  classId: string
  className: string
  teacherId: string
  teacherName: string
  roomId: string | null
  roomName: string | null
}

export type ActiveSessionDto = SessionDto & { status: 'ACTIVE' }

export type Level = 'L1' | 'L2' | 'L3' | 'M1' | 'M2' | 'D1' | 'D2' | 'D3'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
export type EvaluationType = 'DEVOIR' | 'EXAMEN' | 'PARTICIPATION' | 'PROJET'
export type ScheduleStatus = 'PENDING' | 'COMPLETED' | 'CANCELED' | 'MISSED'

export type StudentData = {
  id: string
  user: {
    firstName?: string
    lastName?: string
    email: string
    avatar_url?: string
    sex: 'MALE' | 'FEMALE' | 'OTHER'
    phone?: string
    dateOfBirth?: string
  }
  groupName?: string
  attendanceRate: number
  avgGrade: number | null
}

export type ClassProfileData = {
  id: string
  name: string

  courses: {
    id: string
    name: string
    credits: number
    duration: [number, number]
    teachers: {
      isMain: boolean
      teacher: { user: { firstName?: string; lastName?: string; avatar_url?: string } }
    }[]
  }[]

  upcomingSchedules: {
    id: string
    courseName: string
    teacherName: string
    room: string
    startTime: string
    endTime: string
    status: ScheduleStatus
    courseHoursDone?: number
    courseHoursTotal?: number
  }[]
}

import type { UserStatus } from '@/generated/prisma/client'

export interface StudentRow {
  id: string
  userId: string
  studentNumber: string | null
  status: UserStatus
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    avatar_url: string | null
  }
  programTrack?: { id: string; name: string } | null
  className?: string | null
  phone?: string | null
  parentCount?: number
  attendanceRate?: number
}

export function getStudentDisplayName(student: StudentRow): string {
  const { firstName, lastName } = student.user
  return [firstName, lastName].filter(Boolean).join(' ') || student.user.email
}

export const fullName = getStudentDisplayName

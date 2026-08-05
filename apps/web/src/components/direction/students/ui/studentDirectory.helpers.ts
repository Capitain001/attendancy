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

export function initials(u: { firstName?: string | null; lastName?: string | null }): string {
  return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || '?'
}

export function sexLabel(sex: string | null | undefined): string {
  if (sex === 'MALE') return 'M'
  if (sex === 'FEMALE') return 'F'
  return '—'
}

export function computeAge(dob: Date | string | null | undefined): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const now = new Date()
  const age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  return m < 0 || (m === 0 && now.getDate() < birth.getDate()) ? age - 1 : age
}

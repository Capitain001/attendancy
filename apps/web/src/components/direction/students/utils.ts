import type { GetDirectionStudentsDto } from '@/services/student/types'

export type StudentRow = GetDirectionStudentsDto[number]

export function getStudentDisplayName(student: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}): string {
  const { firstName, lastName, email } = student

  return [firstName, lastName].filter(Boolean).join(' ') || email || ''
}

export const fullName = getStudentDisplayName

export function initials(u: {
  firstName?: string | null
  lastName?: string | null
}): string {
  return (
    `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || '?'
  )
}

export function sexLabel(sex: string | null | undefined): string {
  if (sex === 'MALE') return 'M'
  if (sex === 'FEMALE') return 'F'
  return '—'
}

export function computeAge(
  dob: Date | string | null | undefined,
): number | null {
  if (!dob) return null

  const birth = new Date(dob)
  const now = new Date()

  const age = now.getFullYear() - birth.getFullYear()
  const month = now.getMonth() - birth.getMonth()

  return month < 0 ||
    (month === 0 && now.getDate() < birth.getDate())
    ? age - 1
    : age
}

const AVATAR_COLORS = [
  'oklch(0.58 0.08 256)', // bleu doux
  'oklch(0.58 0.07 162)', // vert doux
  'oklch(0.62 0.07 80)',  // jaune sable
  'oklch(0.58 0.07 232)', // bleu gris
  'oklch(0.60 0.08 25)',  // terracotta doux
  'oklch(0.58 0.08 300)', // mauve doux
  'oklch(0.62 0.07 43)',  // beige chaud
  'oklch(0.58 0.07 190)', // teal doux
]

export function avatarColor(key: string): string {
  let hash = 0

  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }

  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

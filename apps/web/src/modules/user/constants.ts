import type { Role } from '@/types/user'

export const ROLE_LABELS = {
  ADMIN: 'administrateur',
  TEACHER: 'enseignant',
  STUDENT: 'étudiant',
  PARENT: 'parent',
  DIRECTION: 'membre de la direction',
  GUEST: 'invité',
} as const satisfies Record<Role, string>

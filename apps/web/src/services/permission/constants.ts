import type { Action, Resource } from '@/generated/prisma/browser'

export const ACTION_LABELS: Record<Action, string> = {
  CREATE: 'Créer',
  READ: 'Voir',
  UPDATE: 'Modifier',
  DELETE: 'Supprimer',
  CRUD: 'Gestion complète',
}

export const RESOURCE_LABELS: Record<Resource, string> = {
  COURSE: 'les cours',
  SCHEDULE: 'les emplois du temps',
  USER: 'les utilisateurs',
  STUDENT: 'les étudiants',
  TEACHER: 'les enseignants',
  ROOM: 'les salles',
  LOCATION: 'les sites',
  PROGRAM: 'les maquettes',
  FILIERE: 'les filières',
  ATTENDANCE: 'les présences',
  GRADE: 'les notes',
  CLASS: 'les classes',
  MESSAGE: 'les messages',
  JUSTIFICATION: 'les justifications',
}
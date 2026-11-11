// src/features/personal/constants.ts
//apps\web\src\features\personal\constants.ts
export const PERSONAL_LABEL = 'Espace personnel'

export const PERSONAL_NAME = 'PERSONNEL' as const

export const PERSONAL_ROOM_NAME = 'Salle principale' as const

export const PERSONAL_ACADEMIC_YEAR = {
  startDate: new Date('2000-01-01T00:00:00.000Z'),
  endDate: new Date('2100-12-31T00:00:00.000Z'),
  isCurrent: true,
} as const

export const PERSONAL_CLASS = {
  MAX: 5,
} as const

export const PERSONAL = {
  LABEL: PERSONAL_LABEL,
  NAME: PERSONAL_NAME,
  ROOM_NAME: PERSONAL_ROOM_NAME,
  ACADEMIC_YEAR: PERSONAL_ACADEMIC_YEAR,
  CLASS: PERSONAL_CLASS,
} as const
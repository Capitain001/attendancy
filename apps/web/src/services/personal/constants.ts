export const PERSONAL_LABEL = 'Espace personnel'

export const PERSONAL_NAME = 'PERSONNEL' as const

export const PERSONAL_ACADEMIC_YEAR = {
  startDate: new Date('2000-01-01T00:00:00.000Z'),
  endDate: new Date('2100-12-31T00:00:00.000Z'),
  isCurrent: true,
} as const

export const PERSONAL = {
  LABEL: PERSONAL_LABEL,
  NAME: PERSONAL_NAME,
  ACADEMIC_YEAR: PERSONAL_ACADEMIC_YEAR,
} as const
// src/services/class/constants.ts
//src/services/class/constants.ts
import { Level } from '@/generated/prisma/browser'

export const LEVELS = Object.values(Level)

export const LEVEL_LABEL: Record<Level, string> = {
  [Level.L1]: 'Licence 1',
  [Level.L2]: 'Licence 2',
  [Level.L3]: 'Licence 3',
  [Level.M1]: 'Master 1',
  [Level.M2]: 'Master 2',
  [Level.D1]: 'Doctorat 1',
  [Level.D2]: 'Doctorat 2',
  [Level.D3]: 'Doctorat 3',
}

export const PERSONAL_LABEL = 'Espace personnel'

export const PERSONAL_ACADEMIC_YEAR = {
  name: PERSONAL_LABEL,
  startDate: new Date('2000-01-01T00:00:00.000Z'),
  endDate: new Date('2100-12-31T00:00:00.000Z'),
  isCurrent: true,
} as const

export const DEFAULT_CLASS_NAME = 'Classe par défaut' as const as string
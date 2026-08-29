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
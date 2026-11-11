// src/features/personal/services/student-enrollment/generated.types.ts
// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts src/features/personal/services/student-enrollment
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { enrollStudentsInPersonalCourse } from './database'

export type EnrollStudentsInPersonalCourseDto = Awaited<ReturnType<typeof enrollStudentsInPersonalCourse>>

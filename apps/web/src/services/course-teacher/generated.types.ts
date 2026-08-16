// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts course-teacher
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { assignTeacher, deleteTeacherFromCourse, syncCourseTeachers, getCourseTeachers, getCourseTeachersIds } from './database'

export type AssignTeacherDto = Awaited<ReturnType<typeof assignTeacher>>
export type DeleteTeacherFromCourseDto = Awaited<ReturnType<typeof deleteTeacherFromCourse>>
export type SyncCourseTeachersDto = Awaited<ReturnType<typeof syncCourseTeachers>>
export type GetCourseTeachersDto = Awaited<ReturnType<typeof getCourseTeachers>>
export type GetCourseTeachersIdsDto = Awaited<ReturnType<typeof getCourseTeachersIds>>

// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts course
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createCourse, updateCourse, removeCourse, generateCoursesFromProgram, linkCoursesToTerm, getAllCourses, getCourseClassId, getCourse, getCourseDetail, getCourses } from './database'

export type CreateCourseDto = Awaited<ReturnType<typeof createCourse>>
export type UpdateCourseDto = Awaited<ReturnType<typeof updateCourse>>
export type RemoveCourseDto = Awaited<ReturnType<typeof removeCourse>>
export type GenerateCoursesFromProgramDto = Awaited<ReturnType<typeof generateCoursesFromProgram>>
export type LinkCoursesToTermDto = Awaited<ReturnType<typeof linkCoursesToTerm>>
export type GetAllCoursesDto = Awaited<ReturnType<typeof getAllCourses>>
export type GetCourseClassIdDto = Awaited<ReturnType<typeof getCourseClassId>>
export type GetCourseDto = Awaited<ReturnType<typeof getCourse>>
export type GetCourseDetailDto = Awaited<ReturnType<typeof getCourseDetail>>
export type GetCoursesDto = Awaited<ReturnType<typeof getCourses>>

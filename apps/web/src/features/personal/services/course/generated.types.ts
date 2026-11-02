import { createPersonalCourse,getPersonalCourses } from './database'

export type CreatePersonalCourseDto = Awaited<ReturnType<typeof createPersonalCourse>>

export type GetPersonalCoursesDto = Awaited<ReturnType<typeof getPersonalCourses>>;
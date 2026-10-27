import { createPersonalCourse } from './database'

export type CreatePersonalCourseDto = Awaited<ReturnType<typeof createPersonalCourse>>

import type { EnrollStudentInput, AssignStudentGroupInput } from './validation'
import type { getEnrolledStudents, getStudentStats } from './database'

export type { EnrollStudentInput, AssignStudentGroupInput }

export type GetEnrolledStudentsDto = Awaited<ReturnType<typeof getEnrolledStudents>>
export type EnrollmentItem         = GetEnrolledStudentsDto[number]
export type GetStudentStatsDto     = Awaited<ReturnType<typeof getStudentStats>>

import type { EnrollStudentInput, AssignStudentGroupInput } from './validation'
import type { getEnrolledStudents } from './database'

export type { EnrollStudentInput, AssignStudentGroupInput }

export type GetEnrolledStudentsDto = Awaited<ReturnType<typeof getEnrolledStudents>>
export type EnrollmentItem         = GetEnrolledStudentsDto[number]

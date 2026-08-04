import type { EnrollStudentInput, AssignStudentGroupInput } from './validation'
import type { getEnrolledStudents, getStudentStats } from './database'

export type { EnrollStudentInput, AssignStudentGroupInput }

export type EnrollmentItem         = GetEnrolledStudentsDto[number]
export * from './generated.types'

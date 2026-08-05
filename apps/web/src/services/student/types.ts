import type { EnrollStudentInput, AssignStudentGroupInput } from './validation'
import type { GetEnrolledStudentsDto } from './generated.types'

export type { EnrollStudentInput, AssignStudentGroupInput }

export type EnrollmentItem        = GetEnrolledStudentsDto[number]
export type ClassEnrollmentRows   = GetEnrolledStudentsDto
export type ClassEnrollmentRow    = GetEnrolledStudentsDto[number]
export * from './generated.types'

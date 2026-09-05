import type { Prisma } from '@/generated/prisma/client'
import { GetStudentsEnrollmentsDto } from './types'

export type CreateStudentEnrollmentData = Pick<
  Prisma.StudentEnrollmentUncheckedCreateInput,
  'studentId' | 'classId' | 'endedAt'
>

// Seul endedAt est mutable après création : classId et studentId sont figés
// dès la création de l'inscription. Changer de classe passe par
// transferStudentEnrollment (clôture + nouvelle inscription), pas par un
// update in place — cf. commentaire dans database/student-enrollment.mutations.ts.
export type UpdateStudentEnrollmentData = Pick<CreateStudentEnrollmentData, 'endedAt'>

export * from './generated.types'

export type StudentEnrollmentsItem = GetStudentsEnrollmentsDto[number]
import type { Prisma } from '@/generated/prisma/client'
import type { CreateAcademicYearInput, SetCurrentYearInput } from './validation'
import type { getAcademicYears, getCurrentYear } from './database'
import { GetAcademicYearsDto } from './generated.types'

export type { CreateAcademicYearInput, SetCurrentYearInput }

export type AcademicYearItem    = GetAcademicYearsDto[number]

export type CreateAcademicYearData = Pick<Prisma.AcademicYearUncheckedCreateInput, 'name' | 'startDate' | 'endDate'>
export type UpdateAcademicYearData = Partial<CreateAcademicYearData>

// V1 aliases
export type addYearData = CreateAcademicYearInput
export type UpdateYearData = UpdateAcademicYearData
export * from './generated.types'

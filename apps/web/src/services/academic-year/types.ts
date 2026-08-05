import type { CreateAcademicYearInput, SetCurrentYearInput } from './validation'
import type { getAcademicYears, getCurrentYear, UpdateAcademicYearData } from './database'
import { GetAcademicYearsDto } from './generated.types'

export type { CreateAcademicYearInput, SetCurrentYearInput }
export type { UpdateAcademicYearData }

export type AcademicYearItem    = GetAcademicYearsDto[number]

// V1 aliases
export type addYearData = CreateAcademicYearInput
export type UpdateYearData = UpdateAcademicYearData
export * from './generated.types'

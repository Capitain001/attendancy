import type { CreateAcademicYearInput, SetCurrentYearInput } from './validation'
import type { getAcademicYears, getCurrentYear, UpdateAcademicYearData } from './database'

export type { CreateAcademicYearInput, SetCurrentYearInput }
export type { UpdateAcademicYearData }

export type GetAcademicYearsDto = Awaited<ReturnType<typeof getAcademicYears>>
export type GetCurrentYearDto   = Awaited<ReturnType<typeof getCurrentYear>>
export type AcademicYearItem    = GetAcademicYearsDto[number]

// V1 aliases
export type addYearData = CreateAcademicYearInput
export type UpdateYearData = UpdateAcademicYearData

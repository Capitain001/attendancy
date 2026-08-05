import type { CreateUEInput } from './validation'
import type { getUEs, getProgramUEs } from './database'
import { GetUEsDto } from './generated.types'

export type { CreateUEInput }

export type UEItem    = GetUEsDto[number]

// Full UE list for org (used as catalogue for linking to programs)
export type OrgUEDTO = GetUEsDto

// ProgramUE types (UEs attached to a program, with courses)
export type ProgramUEsDTO = Awaited<ReturnType<typeof getProgramUEs>>
export type ProgramUEDTO  = ProgramUEsDTO[number]
export type UeCourseDTO   = ProgramUEDTO['ue']['ueCourses'][number]

export type ProgramUECourses = {
  programUEId: string
  semester: number
  order: number | null
  ue: ProgramUEDTO['ue']
  ueTotalCredits: number
  ueTotalDuration: number
}

export type ProgramSemesterDTO = {
  semester: number
  totalCredits: number
  totalDuration: number
  ues: ProgramUECourses[]
}

export type ProgramTable = ProgramSemesterDTO[]

// Re-export reorder payload types from validation (single source)
export type { UEOrder, CourseOrder, ReorderProgramPayload } from './validation'
export * from './generated.types'

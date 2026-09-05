// src/services/ue/types.ts
import type { CreateUEInput } from './validation'
import type { getProgramUEs } from './database'
import { GetUEsDto, CreateUEDto  } from './generated.types'

export type { CreateUEInput }

export type UEItem    = GetUEsDto[number]
export type CreateUEsDTO = CreateUEDto

// Full UE list for org (used as catalogue for linking to programs)
export type OrgUEDTO = GetUEsDto

// ProgramUE types (UEs attached to a program, with courses)
export type GetProgramUEsDto = Awaited<ReturnType<typeof getProgramUEs>>
export type ProgramUEsItem  = GetProgramUEsDto[number]
export type UeCourseDTO   = ProgramUEsItem['ue']['ueCourses'][number]

export type ProgramUECourses = {
  programUEId: string
  semester: number
  order: number | null
  ue: ProgramUEsItem['ue']
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


/* 
type ProgramUECourses = {
    programUEId: string;
    semester: number;
    order: number | null;
    ue: {
        code: string | null;
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        departmentId: string | null;
        type: UEType;
        department: {
            id: string;
            name: string;
        } | null;
        ueCourses: {
            code: string | null;
            id: string;
            order: number | null;
            name: string;
            credits: number;
            duration: number;
            settings: JsonValue;
        }[];
    };
    ueTotalCredits: number;
    ueTotalDuration: number;

}

*/
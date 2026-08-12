import type { ProgramSemesterDTO } from '@/services/ue/types'

export interface ProgramOrganizationData {
  name?: string
  slug?: string
  logo?: string | null
  details?: {
    contact?: Array<{
      ville?: string
      emails?: string[]
      phones?: string[]
      indicatif?: string
      'adresse-postale'?: string
    }>
    [key: string]: unknown
  }
}

export interface ProgramPageData {
  class: {
    name: string
    level: string
    programTrack: string
    program: string
    academicYear: string
  }
  organization?: ProgramOrganizationData
  semesters: ProgramSemesterDTO[]
}

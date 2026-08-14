// src/services/program/types.ts
import type { Prisma } from '@/generated/prisma/client'
import { getClassProgram, getProgramList, getPrograms } from "./database";


export type ClassProgram = Awaited< ReturnType<typeof getClassProgram>>

export type CreateProgramData = Pick<Prisma.ProgramUncheckedCreateInput, 'name' | 'description' | 'programTrackId'> & { classId?: string }
export type UpdateProgramData = Partial<CreateProgramData>

export * from './generated.types'

// src/services/program/types.ts
import { getClassProgram, getProgramList, getPrograms } from "./database";


export type ClassProgram = Awaited< ReturnType<typeof getClassProgram>>
export * from './generated.types'

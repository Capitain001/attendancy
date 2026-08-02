// src/services/program/types.ts
import { getClassProgram, getProgramList, getPrograms } from "./database";

export type ProgramDto = Awaited< ReturnType<typeof getPrograms>>[number];
export type ProgramListDto = Awaited< ReturnType<typeof getProgramList>>;

export type ClassProgram = Awaited< ReturnType<typeof getClassProgram>>

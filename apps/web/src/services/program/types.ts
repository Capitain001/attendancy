import type { Prisma } from '@/generated/prisma/client';
import { getClassProgram, getProgramList, getPrograms } from './database';
import type { GetProgramsDto, GetProgramListDto } from './generated.types';

export type ClassProgram = Awaited<ReturnType<typeof getClassProgram>>;

export type ProgramItem = GetProgramsDto[number];
export type ProgramDto = ProgramItem;
export type ProgramListItem = GetProgramListDto[number];

export type CreateProgramData = Pick<Prisma.ProgramUncheckedCreateInput, 'name' | 'description' | 'programTrackId'> & { classId?: string };
export type UpdateProgramData = Partial<CreateProgramData>;

export * from './generated.types';

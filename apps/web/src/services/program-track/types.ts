import type { GetProgramTracksDto } from './generated.types';
import { groupProgramTracksByDepartment } from './utils';

export type ProgramTrackItem = GetProgramTracksDto[number];
export type ProgramTrackDto = ProgramTrackItem;
export type ProgramTrackByDepartment = Awaited<ReturnType<typeof groupProgramTracksByDepartment>>[number];

export * from './generated.types';

import type { GetProgramTracksDto } from './generated.types';
import { groupProgramTracksByDepartment } from './utils';

//a suprimer plustard
export type ProgramTrackItem = GetProgramTracksDto[number];

// good naming
export type GetProgramTracksItem = GetProgramTracksDto[number];
export type ProgramTrackDto = ProgramTrackItem;
export type ProgramTrackByDepartment = Awaited<ReturnType<typeof groupProgramTracksByDepartment>>[number];

export * from './generated.types';

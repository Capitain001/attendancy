import type { CreateProgramTrackInput, CreateProgramInput, AddUEToProgramInput } from './validation'
import type { getProgramTracks, getProgramsByTrack } from './database'

export type { CreateProgramTrackInput, CreateProgramInput, AddUEToProgramInput }

export type GetProgramTracksDto  = Awaited<ReturnType<typeof getProgramTracks>>
export type ProgramTrackItem     = GetProgramTracksDto[number]
export type GetProgramsByTrackDto = Awaited<ReturnType<typeof getProgramsByTrack>>
export type ProgramItem          = GetProgramsByTrackDto[number]
export type ProgramUEItem        = ProgramItem['programUEs'][number]

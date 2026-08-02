//src/services/program-track/types.ts
import {  getProgramTracks } from "./database";


export type ProgramTracksDto = Awaited<ReturnType<typeof getProgramTracks>>;
export type ProgramTrackDto = ProgramTracksDto[number]


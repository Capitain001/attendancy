// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts program-track
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createProgramTrack, updateProgramTrack, deleteProgramTrack, getProgramTracks, getProgramTracksBasic, getProgramTrack } from './database'

export type CreateProgramTrackDto = Awaited<ReturnType<typeof createProgramTrack>>
export type UpdateProgramTrackDto = Awaited<ReturnType<typeof updateProgramTrack>>
export type DeleteProgramTrackDto = Awaited<ReturnType<typeof deleteProgramTrack>>
export type GetProgramTracksDto = Awaited<ReturnType<typeof getProgramTracks>>
export type GetProgramTracksBasicDto = Awaited<ReturnType<typeof getProgramTracksBasic>>
export type GetProgramTrackDto = Awaited<ReturnType<typeof getProgramTrack>>

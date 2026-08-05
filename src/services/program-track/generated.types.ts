// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts program-track
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getProgramTracks, getProgramTracksBasic, getProgramTrack } from './database'

export type GetProgramTracksDto = Awaited<ReturnType<typeof getProgramTracks>>
export type GetProgramTracksBasicDto = Awaited<ReturnType<typeof getProgramTracksBasic>>
export type GetProgramTrackDto = Awaited<ReturnType<typeof getProgramTrack>>

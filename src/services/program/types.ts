import type { getPrograms } from './database'

export type ProgramDto = Awaited<ReturnType<typeof getPrograms>>[number]

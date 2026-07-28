import type { generateTermsFromProgram } from './database'

export type GenerateTermsDto = Awaited<ReturnType<typeof generateTermsFromProgram>>

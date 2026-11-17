// src/utils/server/error.ts
// Erreur typée portant un code, lue uniquement dans les actions via buildError().
// Levée par tryConstraint() (utils/server/prisma.ts) et par les mutations database/.
import { ERRORS, ERROR_CODES } from '@/config'
import type { ErrorCode } from '@/config'

export type ErrorType = { message: string; code: ErrorCode }

// Hérite de Error : le code qui lit déjà e.message continue de fonctionner.
export class AppError extends Error {
  readonly code: ErrorCode

  constructor({ message, code }: ErrorType) {
    super(message)
    this.code = code
  }
}

// Seul endroit où une erreur devient la branche erreur d'ApiResponse.
// Une erreur non typée ne fuite jamais son message technique vers le client.
export function buildError(error: unknown): { error: string; code: ErrorCode } {
  if (error instanceof AppError) return { error: error.message, code: error.code }
  return { error: ERRORS.SERVER, code: ERROR_CODES.SERVER }
}
// src/utils/server/prisma.ts
// Traduction des erreurs Prisma/Postgres en messages métier lisibles.
// Utilisé par les mutations database/ : wrapper l'appel Prisma dans
// tryConstraint() pour convertir P2002/P2003/P2025 et les erreurs de trigger
// en Error à message utilisateur (mappings dans src/config/constants.ts).
import { CONSTRAINT_ERROR, ERRORS, TRIGGER_ERROR } from '@/config'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'

export async function tryUnique<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (error) {
    uniqueError(error)
    throw error
  }
}

export async function tryConstraint<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (error) {
    tryTriggerError(error)

    if (!(error instanceof PrismaClientKnownRequestError)) {
      throw error
    }

    switch (error.code) {
      case 'P2002':
        return uniqueError(error)

      case 'P2003': {
        const constraint = String(error.meta?.constraint ?? '')
        if (constraint && CONSTRAINT_ERROR[constraint]) {
          throw new Error(CONSTRAINT_ERROR[constraint])
        }
        throw new Error(ERRORS.DB.FOREIGN_KEY)
      }

      case 'P2025':
        throw new Error(ERRORS.DB.NOT_FOUND)

      default:
        throw error
    }
  }
}

function tryTriggerError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  const key = Object.keys(TRIGGER_ERROR).find((k) => message.includes(k))
  if (key) throw new Error(TRIGGER_ERROR[key])
}

export function uniqueError(error: unknown): never {
  if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = normalizeConstraintTarget(error.meta?.target as string[] | undefined)
    if (target && CONSTRAINT_ERROR[target]) throw new Error(CONSTRAINT_ERROR[target])
    throw new Error(ERRORS.UNIQUE.DEFAULT)
  }
  throw error
}

export function normalizeConstraintTarget(target?: string[]): string {
  return target?.sort().join(',') ?? ''
}

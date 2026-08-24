// src/utils/server/prisma.ts
// Traduction des erreurs Prisma/Postgres en messages métier lisibles.
// Utilisé par les mutations database/ : wrapper l'appel Prisma dans
// tryConstraint() pour convertir P2002/P2003/P2025 et les erreurs de trigger
// en Error à message utilisateur (mappings dans src/config/constants.ts).
import { CONSTRAINT_ERROR, ERRORS, TRIGGER_ERROR } from '@/config'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'
import { debugPrismaError } from './debug'

export function ScheduleConflict(error: any) {
  return (
    error?.code === "P2010" ||
    error?.message?.includes("overlap") ||
    error?.cause?.message?.includes("23P01")
  );
}

// ── Erreurs de connexion (base injoignable) ───────────────────────────────────
//
// P1001 : "Can't reach database server at ..." — la requête n'a jamais atteint
// la base (réseau, pooler en pause, DB suspendue). C'est une panne d'infra,
// pas un refus métier de la DB — donc PAS une PrismaClientKnownRequestError.
// Selon le point d'entrée Prisma, ça remonte comme :
//   - PrismaClientInitializationError (le plus courant, errorCode 'P1001')
//   - parfois une erreur générique dont le message contient "Can't reach
//     database server" (driver adapter / pooler)
// Détection par message plutôt que par instanceof exclusif : plus robuste aux
// variations de forme entre versions/adapters Prisma.
//
// Cf. old_OPERATOR_ACTIONS.md — OP-01 : signal d'une situation hors scope
// agent (réseau, instance Supabase en pause). Ce patch ne "corrige" pas la
// panne, il évite seulement de laisser fuiter la stack technique brute
// jusqu'à l'utilisateur final.
function isConnectionError(error: unknown): boolean {
  if (error instanceof PrismaClientKnownRequestError && error.code === 'P1001') {
    return true
  }
  const code = (error as { errorCode?: string })?.errorCode
  if (code === 'P1001') return true

  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes("Can't reach database server") ||
    message.includes('P1001')
  )
}

export async function tryUnique<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.log("tryUnique error : ", error);
    if (isConnectionError(error)) {
      throw new Error(ERRORS.DB.UNREACHABLE)
    }
    uniqueError(error); // transforme les erreurs Prisma connues en erreurs UX
    throw error;        // relance les autres erreurs
  }
}


export async function tryConstraint<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (error) {
    // Panne d'infra (base injoignable) : à traiter AVANT tryTriggerError
    // (qui fait un .includes() sur le message — pas concerné ici mais on
    // court-circuite tôt) et avant le guard instanceof qui exclurait une
    // PrismaClientInitializationError.
    if (isConnectionError(error)) {
      if (process.env.NODE_ENV === "development") {
        void debugPrismaError(error as any);
      }
      throw new Error(ERRORS.DB.UNREACHABLE)
    }

    tryTriggerError(error)

    if (!(error instanceof PrismaClientKnownRequestError)) {
      throw error
    }

    // DEBUG ONLY (dev) — async, fire-and-forget (ne bloque pas le throw)
    if (process.env.NODE_ENV === "development") {
      void debugPrismaError(error);
    }


    switch (error.code) {
      case 'P2002':
        return uniqueError(error)

      case 'P2003': {
        // Prisma 6 : meta.constraint était la string FK directe.
        // Prisma 7 + pg adapter : meta.constraint absent — dans driverAdapterError.cause.constraint.index.
        const constraint =
          String(error.meta?.constraint ?? '') ||
          extractDriverConstraint(error)
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
    const target = resolveUniqueConstraint(error)
    if (target && CONSTRAINT_ERROR[target]) throw new Error(CONSTRAINT_ERROR[target])
    throw new Error(ERRORS.UNIQUE.DEFAULT)
  }
  throw error
}

export function normalizeConstraintTarget(target?: string[]): string {
  return target?.sort().join(',') ?? ''
}

// ── Forme réelle des erreurs Prisma 7 + @prisma/adapter-pg (capturée sur DB) ──
//
// P2002 — UniqueConstraintViolation
//   error.code : 'P2002'
//   error.meta : {
//     modelName          : 'AcademicYear',
//     target             : undefined,               // absent — Prisma 6 renvoyait string[]
//     driverAdapterError : {
//       cause: {
//         originalCode   : '23505',
//         originalMessage: 'duplicate key value violates unique constraint "AcademicYear_name_orgId_key"',
//         kind           : 'UniqueConstraintViolation',
//         constraint     : { fields: ['name', '"orgId"'] }  // champs, PAS le nom de contrainte
//       }
//     }
//   }
//   → nom de contrainte extrait par regex sur originalMessage (voir extractUniqueConstraintName).
//
// P2003 — ForeignKeyConstraintViolation
//   error.code : 'P2003'
//   error.meta : {
//     modelName          : 'AcademicYear',
//     constraint         : undefined,               // absent — Prisma 6 renvoyait string
//     driverAdapterError : {
//       cause: {
//         originalCode   : '23503',
//         originalMessage: 'insert or update on table "AcademicYear" violates foreign key constraint "AcademicYear_orgId_fkey"',
//         kind           : 'ForeignKeyConstraintViolation',
//         constraint     : { index: 'AcademicYear_orgId_fkey' }
//       }
//     }
//   }
//   → nom FK extrait via driverAdapterError.cause.constraint.index (voir extractDriverConstraint).
//
// P2025 — RecordNotFound
//   error.code : 'P2025'
//   error.meta : { modelName: 'Organization', operation: 'a delete' }

type DriverCause = {
  originalMessage?: string
  constraint?: { fields?: string[]; index?: string }
}

function driverCause(error: PrismaClientKnownRequestError): DriverCause {
  return ((error.meta as Record<string, unknown> | undefined)
    ?.driverAdapterError as { cause?: DriverCause } | undefined)
    ?.cause ?? {}
}

// Extrait le nom de la contrainte depuis originalMessage (P2002 unique).
// "...unique constraint \"AcademicYear_name_orgId_key\"" → 'AcademicYear_name_orgId_key'
function extractUniqueConstraintName(error: PrismaClientKnownRequestError): string {
  const msg = driverCause(error).originalMessage ?? ''
  const match = /unique constraint "([^"]+)"/.exec(msg)
  return match?.[1] ?? ''
}

// Extrait la clé FK depuis driverAdapterError (P2003).
function extractDriverConstraint(error: PrismaClientKnownRequestError): string {
  return driverCause(error).constraint?.index ?? ''
}

// Résolution du nom de contrainte unique — compatible Prisma 6 + Prisma 7.
function resolveUniqueConstraint(error: PrismaClientKnownRequestError): string {
  // Prisma 6 : meta.target = ['ConstraintName'] → sort + join
  const fromTarget = normalizeConstraintTarget(error.meta?.target as string[] | undefined)
  if (fromTarget) return fromTarget
  // Prisma 7 + pg adapter
  return extractUniqueConstraintName(error)
}
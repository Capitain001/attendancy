// src/utils/server/prisma.ts
// Traduction des erreurs Prisma/Postgres en AppError (message + code).
// Utilisé par les mutations database/ : wrapper l'appel Prisma dans
// tryConstraint() pour convertir P2002/P2003/P2025, les erreurs de trigger
// et les pannes de connexion (mappings dans src/config/constants.ts).
// Le code est déduit du type d'erreur ; l'action le lit via buildError().
import { CONSTRAINT_ERROR, ERRORS, ERROR_CODES, TRIGGER_ERROR } from '@/config'
import type { ConstraintName } from '@/config'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'
import { debugPrismaError } from './debug'
import { AppError } from './error'


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

// Codes déduits du type d'erreur :
//   base injoignable → UNAVAILABLE   (réessayer plus tard)
//   P2002 / trigger  → CONFLICT      (ne pas réessayer tel quel)
//   P2003            → BAD_REQUEST
//   P2025            → NOT_FOUND
export async function tryConstraint<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (error) {
    // Panne d'infra (base injoignable) : à traiter AVANT throwTriggerError
    // et avant le guard instanceof qui exclurait une PrismaClientInitializationError.
    if (isConnectionError(error)) {
      if (process.env.NODE_ENV === "development") {
        void debugPrismaError(error as any);
      }
      throw new AppError({ message: ERRORS.DB.UNREACHABLE, code: ERROR_CODES.UNAVAILABLE })
    }

    throwTriggerError(error)

    if (!(error instanceof PrismaClientKnownRequestError)) {
      throw error
    }

    // DEBUG ONLY (dev) — async, fire-and-forget (ne bloque pas le throw)
    if (process.env.NODE_ENV === "development") {
      void debugPrismaError(error);
    }

    const constraintName = resolveConstraintName(error)

    switch (error.code) {
      case 'P2002':
        throw new AppError({
          message: CONSTRAINT_ERROR[constraintName as ConstraintName] ?? ERRORS.UNIQUE.DEFAULT,
          code: ERROR_CODES.CONFLICT,
        })

      case 'P2003':
        throw new AppError({
          message: CONSTRAINT_ERROR[constraintName as ConstraintName] ?? ERRORS.DB.FOREIGN_KEY,
          code: ERROR_CODES.BAD_REQUEST,
        })

      case 'P2025':
        throw new AppError({ message: ERRORS.DB.NOT_FOUND, code: ERROR_CODES.NOT_FOUND })

      default:
        throw error
    }
  }
}

// Nom de la contrainte Postgres en cause (P2002 unique, P2003 clé étrangère), '' sinon.
function resolveConstraintName(error: PrismaClientKnownRequestError): string {
  if (error.code === 'P2002') return resolveUniqueConstraint(error)
  // Prisma 6 : meta.constraint était la string FK directe.
  // Prisma 7 + pg adapter : meta.constraint absent — dans driverAdapterError.cause.constraint.index.
  if (error.code === 'P2003') return String(error.meta?.constraint ?? '') || extractDriverConstraint(error)
  return ''
}

function throwTriggerError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  const key = Object.keys(TRIGGER_ERROR).find((k) => message.includes(k))
  if (key) throw new AppError({ message: TRIGGER_ERROR[key], code: ERROR_CODES.CONFLICT })
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
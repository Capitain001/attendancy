// src/services/planning/conflict/check/conflicts.ts

import { prisma } from '@/lib/prisma'
import { PrismaClient, Prisma } from '@/generated/prisma/client'

// Noms des contraintes GiST Postgres (définis dans prisma/post-migrate/).
const DB_CONSTRAINTS = {
  ROOM_OVERLAP:    'no_room_overlap',
  TEACHER_OVERLAP: 'no_teacher_overlap',
  CLASS_OVERLAP:   'no_class_overlap_global',
  GROUP_OVERLAP:   'no_group_overlap',
} as const

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Occurrence {
  startTime:         Date
  endTime:           Date
  courseId:          string
  teacherId:         string
  roomId:            string
  classId:           string
  orgId:             string
  groupId?:          string
  weekRecurrenceId?: string
}

export type ConflictReason =
  | 'ROOM_OVERLAP'
  | 'TEACHER_OVERLAP'
  | 'CLASS_OVERLAP'
  | 'GROUP_OVERLAP'

export type ConflictReport = {
  isValid:   boolean
  total:     number
  skipped:   number
  checked:   number
  conflicts: {
    startTime:    Date
    endTime:      Date
    roomId:       string
    teacherId:    string
    classId:      string
    groupId?:     string
    reason:       ConflictReason
    message:      string
    dbConstraint: string
    conflictsWith: {
      id:        string
      startTime: Date
      endTime:   Date
      roomId:    string
      teacherId: string
      courseId:  string
      classId:   string
      groupId:   string | null
    } | null
  }[]
}

// ── Types internes ────────────────────────────────────────────────────────────

type PrismaConstraintError = {
  code?:    string
  message?: string
  cause?:   { code?: string; message?: string }
}

type OccupyingRow = ConflictReport['conflicts'][number]['conflictsWith']

// ── Maps ──────────────────────────────────────────────────────────────────────

const REASON_TO_CONSTRAINT: Record<ConflictReason, string> = {
  ROOM_OVERLAP:    DB_CONSTRAINTS.ROOM_OVERLAP,
  TEACHER_OVERLAP: DB_CONSTRAINTS.TEACHER_OVERLAP,
  CLASS_OVERLAP:   DB_CONSTRAINTS.CLASS_OVERLAP,
  GROUP_OVERLAP:   DB_CONSTRAINTS.GROUP_OVERLAP,
}

const REASON_TO_MESSAGE: Record<ConflictReason, string> = {
  ROOM_OVERLAP:    'Conflit salle : la salle est déjà occupée sur ce créneau.',
  TEACHER_OVERLAP: "Conflit enseignant : l'enseignant est déjà assigné sur ce créneau.",
  CLASS_OVERLAP:   'Conflit classe : la classe a déjà une séance sur ce créneau.',
  GROUP_OVERLAP:   'Conflit groupe : le groupe a déjà une séance sur ce créneau.',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function asConstraintError(error: unknown): PrismaConstraintError {
  if (typeof error !== 'object' || !error) return {}
  return error as PrismaConstraintError
}

export function isDbConstraintViolation(error: unknown): boolean {
  const parsed  = asConstraintError(error)
  const message = parsed.message ?? parsed.cause?.message ?? ''

  return (
    parsed.code === 'P2010' ||
    parsed.cause?.code === '23P01' ||
    message.includes('23P01') ||
    message.includes(DB_CONSTRAINTS.ROOM_OVERLAP) ||
    message.includes(DB_CONSTRAINTS.TEACHER_OVERLAP) ||
    message.includes(DB_CONSTRAINTS.CLASS_OVERLAP) ||
    message.includes(DB_CONSTRAINTS.GROUP_OVERLAP)
  )
}

export function extractDbErrorMessage(error: unknown): string {
  const parsed = asConstraintError(error)
  return parsed.message ?? parsed.cause?.message ?? ''
}

export function detectConflictReason(message: string): ConflictReason | null {
  if (message.includes(DB_CONSTRAINTS.ROOM_OVERLAP))    return 'ROOM_OVERLAP'
  if (message.includes(DB_CONSTRAINTS.TEACHER_OVERLAP)) return 'TEACHER_OVERLAP'
  if (message.includes(DB_CONSTRAINTS.CLASS_OVERLAP))   return 'CLASS_OVERLAP'
  if (message.includes(DB_CONSTRAINTS.GROUP_OVERLAP))   return 'GROUP_OVERLAP'
  return null
}

export function getConflictMeta(reason: ConflictReason): { dbConstraint: string; message: string } {
  return {
    dbConstraint: REASON_TO_CONSTRAINT[reason],
    message:      REASON_TO_MESSAGE[reason],
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function checkConflicts({
  weekRecurrenceId,
  occurrences,
  excludeScheduleId,
  prismaClient,
}: {
  weekRecurrenceId?:  string
  occurrences:        Occurrence[]
  excludeScheduleId?: string
  prismaClient?:      PrismaClient
}): Promise<ConflictReport> {
  const client = prismaClient ?? prisma
  const now    = new Date()
  const future = occurrences.filter((o) => o.startTime >= now)

  const report: ConflictReport = {
    isValid:   true,
    total:     occurrences.length,
    skipped:   occurrences.length - future.length,
    checked:   future.length,
    conflicts: [],
  }

  if (!future.length) return report

  try {
    await client.$transaction(async (tx) => {
      // Récurrence : retire les futurs PENDING pour tester sans faux positifs
      if (weekRecurrenceId) {
        await tx.schedule.deleteMany({
          where: { weekRecurrenceId, startTime: { gte: now }, status: 'PENDING' },
        })
      }

      // Mode update : retire le schedule lui-même pour éviter l'auto-overlap
      if (excludeScheduleId) {
        await tx.schedule.deleteMany({ where: { id: excludeScheduleId } })
      }

      for (const occ of future) {
        const { weekRecurrenceId: _wrid, ...occData } = occ

        try {
          await tx.$executeRaw`SAVEPOINT before_insert`
          await tx.schedule.create({
            data: {
              ...occData,
              weekRecurrenceId: weekRecurrenceId ?? null,
              status: 'PENDING',
            },
          })
          await tx.$executeRaw`RELEASE SAVEPOINT before_insert`
        } catch (error: unknown) {
          await tx.$executeRaw`ROLLBACK TO SAVEPOINT before_insert`

          if (!isDbConstraintViolation(error)) throw error

          const dbErrorMessage = extractDbErrorMessage(error)
          const reason         = detectConflictReason(dbErrorMessage)

          if (!reason) throw error
          if (reason === 'GROUP_OVERLAP' && !occ.groupId) throw error

          const meta = getConflictMeta(reason)

          const filterMap: Record<ConflictReason, Prisma.Sql> = {
            ROOM_OVERLAP:    Prisma.sql`"roomId"    = ${occ.roomId}::uuid`,
            TEACHER_OVERLAP: Prisma.sql`"teacherId" = ${occ.teacherId}::uuid`,
            CLASS_OVERLAP:   Prisma.sql`"classId"   = ${occ.classId}::uuid`,
            GROUP_OVERLAP:   occ.groupId
              ? Prisma.sql`"groupId" = ${occ.groupId}::uuid`
              : Prisma.sql`FALSE`,
          }

          const [occupying] = await tx.$queryRaw<NonNullable<OccupyingRow>[]>`
            SELECT id, "startTime", "endTime", "roomId", "teacherId", "courseId", "classId", "groupId"
            FROM "Schedule"
            WHERE "deletedAt" IS NULL
              AND status NOT IN ('CANCELED', 'MISSED')
              AND during && tstzrange(${occ.startTime}::timestamptz, ${occ.endTime}::timestamptz, '[)')
              AND ${filterMap[reason]}
            LIMIT 1
          `

          report.conflicts.push({
            startTime:     occ.startTime,
            endTime:       occ.endTime,
            roomId:        occ.roomId,
            teacherId:     occ.teacherId,
            classId:       occ.classId,
            groupId:       occ.groupId,
            reason,
            message:       meta.message,
            dbConstraint:  meta.dbConstraint,
            conflictsWith: occupying ?? null,
          })
        }
      }

      // Rollback intentionnel — rien n'est écrit en base
      throw new Error('SIMULATION_ROLLBACK')
    })
  } catch (error: unknown) {
    if (!(error instanceof Error) || error.message !== 'SIMULATION_ROLLBACK') {
      throw error
    }
  }

  report.isValid = !report.conflicts.length
  return report
}

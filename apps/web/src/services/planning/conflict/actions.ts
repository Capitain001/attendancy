'use server'

import { Prisma }     from '@/generated/prisma/client'
import * as v         from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS }     from '@/config'
import { prisma }     from '@/lib/prisma'

import { checkAvailability }        from './check'
import { checkConflicts }           from './check/conflicts'
import { checkConflictsParamsSchema, uidSchema } from './validation'

import type { CheckAvailabilityParams, CheckAvailabilityResult } from './check'
import type { ConflictReport, Occurrence }                       from './check/conflicts'

// ── checkAvailabilityAction ───────────────────────────────────────────────────

export type CheckAvailabilityActionParams = Omit<CheckAvailabilityParams, 'orgId' | 'prismaClient'>

export async function checkAvailabilityAction(
  params: CheckAvailabilityActionParams,
): Promise<{ data: NonNullable<CheckAvailabilityResult['data']> } | { error: string }> {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const result = await checkAvailability({ ...params, orgId, prismaClient: prisma })
    if (result.error) return { error: result.error }
    return { data: result.data! }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// ── checkConflictsAction ──────────────────────────────────────────────────────

export type ConflictReportDto = {
  isValid:  boolean
  total:    number
  skipped:  number
  checked:  number
  conflicts: {
    startTime:    string
    endTime:      string
    roomId:       string
    teacherId:    string
    classId:      string
    groupId?:     string
    reason:       ConflictReport['conflicts'][number]['reason']
    message:      string
    dbConstraint: string
    conflictsWith: {
      id:        string
      startTime: string
      endTime:   string
      roomId:    string
      teacherId: string
      courseId:  string
      classId:   string
      groupId:   string | null
    } | null
  }[]
}

type OccurrenceInput = Omit<Occurrence, 'orgId'>

export type CheckConflictsActionParams = {
  occurrences:        OccurrenceInput[]
  weekRecurrenceId?:  string
  excludeScheduleId?: string
}

function serializeConflictReport(report: ConflictReport): ConflictReportDto {
  return {
    isValid: report.isValid,
    total:   report.total,
    skipped: report.skipped,
    checked: report.checked,
    conflicts: report.conflicts.map((c) => ({
      startTime:    c.startTime.toISOString(),
      endTime:      c.endTime.toISOString(),
      roomId:       c.roomId,
      teacherId:    c.teacherId,
      classId:      c.classId,
      groupId:      c.groupId,
      reason:       c.reason,
      message:      c.message,
      dbConstraint: c.dbConstraint,
      conflictsWith: c.conflictsWith
        ? {
            id:        c.conflictsWith.id,
            startTime: c.conflictsWith.startTime.toISOString(),
            endTime:   c.conflictsWith.endTime.toISOString(),
            roomId:    c.conflictsWith.roomId,
            teacherId: c.conflictsWith.teacherId,
            courseId:  c.conflictsWith.courseId,
            classId:   c.conflictsWith.classId,
            groupId:   c.conflictsWith.groupId,
          }
        : null,
    })),
  }
}

export async function checkConflictsAction(params: CheckConflictsActionParams) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(checkConflictsParamsSchema, params)
  if (!parsed.success) return { error: 'Paramètres invalides.' as const }

  try {
    const occurrences: Occurrence[] = parsed.output.occurrences.map((o) => ({
      ...o,
      orgId,
    }))

    const report = await checkConflicts({
      weekRecurrenceId:  parsed.output.weekRecurrenceId,
      occurrences,
      excludeScheduleId: parsed.output.excludeScheduleId,
    })

    return { data: serializeConflictReport(report) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// ── filterAvailabilityAction ──────────────────────────────────────────────────

export type AvailableItem = { id: string; available: boolean }

export type FilterAvailabilityResponse = {
  availableRooms:    AvailableItem[]
  availableCourses:  AvailableItem[]
  availableTeachers: AvailableItem[]
}

export interface FilterAvailabilityActionParams {
  start:              Date
  end:                Date
  rooms:              { id: string }[]
  courses:            { id: string }[]
  teachers:           { id: string }[]
  excludeScheduleId?: string
}

const MAX_ITEMS = 200

export async function filterAvailabilityAction(
  params: FilterAvailabilityActionParams,
): Promise<{ data: FilterAvailabilityResponse } | { error: string }> {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const { start, end, excludeScheduleId, rooms, courses, teachers } = params

  if (start >= end) {
    return { error: "L'heure de fin doit être après l'heure de début." }
  }

  if (rooms.length > MAX_ITEMS || courses.length > MAX_ITEMS || teachers.length > MAX_ITEMS) {
    return { error: "Trop d'éléments transmis." }
  }

  if (excludeScheduleId) {
    const result = v.safeParse(uidSchema, excludeScheduleId)
    if (!result.success) return { error: 'excludeScheduleId invalide.' }
  }

  try {
    const overlapping = await prisma.$queryRaw<Array<{ roomId: string; teacherId: string | null }>>`
      SELECT "roomId", "teacherId"
      FROM   "Schedule"
      WHERE  "orgId"     = ${orgId}::uuid
        AND  "deletedAt" IS NULL
        AND  status NOT IN ('CANCELED', 'MISSED')
        AND (
              during && tstzrange(
                ${start.toISOString()}::timestamptz,
                ${end.toISOString()}::timestamptz,
                '[)'
              )
              OR (
                during IS NULL
                AND "startTime" < ${end.toISOString()}::timestamptz
                AND "endTime"   > ${start.toISOString()}::timestamptz
              )
            )
        ${excludeScheduleId
          ? Prisma.sql`AND id != ${excludeScheduleId}::uuid`
          : Prisma.empty}
    `

    const busyRoomIds    = new Set(overlapping.map((s) => s.roomId))
    const busyTeacherIds = new Set(
      overlapping.map((s) => s.teacherId).filter((id): id is string => id !== null),
    )

    return {
      data: {
        availableRooms:    rooms.map((r)    => ({ id: r.id, available: !busyRoomIds.has(r.id) })),
        availableCourses:  courses.map((c)  => ({ id: c.id, available: true })),
        availableTeachers: teachers.map((t) => ({ id: t.id, available: !busyTeacherIds.has(t.id) })),
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

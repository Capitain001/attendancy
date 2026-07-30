// src/services/planning/conflict/check/availability.ts
// Logique pure — testable sans Next.js

import { Prisma, PrismaClient } from '@/generated/prisma/client'
import { string, uuid, safeParse, pipe, array } from 'valibot'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CheckAvailabilityParams {
  start:              Date
  end:                Date
  rooms:              { id: string }[]
  teachers:           { id: string }[]
  classes:            { id: string }[]
  groups?:            { id: string }[]
  excludeScheduleId?: string
  orgId:              string
  prismaClient:       PrismaClient
}

export interface CheckAvailabilityResult {
  data?: {
    rooms:    { id: string; available: boolean }[]
    teachers: { id: string; available: boolean }[]
    classes:  { id: string; available: boolean }[]
    groups:   { id: string; available: boolean }[]
  }
  error?: string
}

// ── Validation ────────────────────────────────────────────────────────────────

const uuidSchema      = pipe(string(), uuid())
const uuidArraySchema = array(pipe(string(), uuid()))
export const MAX_ITEMS = 200

// ── Logique pure ──────────────────────────────────────────────────────────────

/**
 * ─────────────────────────────────────────────────────────────
 * ALGORITHME GLOBAL
 * ─────────────────────────────────────────────────────────────
 *
 * 1. Valider les entrées (temps, volume, UUID)
 * 2. Récupérer les schedules en conflit dans la DB
 *    → filtrés par organisation
 *    → filtrés par overlap temporel (colonne `during` tstzrange)
 *    → filtrés par ressources concernées
 * 3. Construire des Sets (lookup O(1))
 * 4. Marquer chaque ressource comme disponible ou non
 *
 * Le backend est la source de vérité — le frontend ne fait qu'afficher.
 */
export async function checkAvailability(params: CheckAvailabilityParams): Promise<CheckAvailabilityResult> {
  const {
    start,
    end,
    excludeScheduleId,
    rooms,
    teachers,
    classes,
    groups = [],
    orgId,
    prismaClient,
  } = params

  // ── 1. Validation temporelle ──────────────────────────────
  if (start >= end) {
    return { error: "L'heure de fin doit être après l'heure de début." }
  }

  // ── 2. Validation du volume ───────────────────────────────
  if (
    rooms.length    > MAX_ITEMS ||
    teachers.length > MAX_ITEMS ||
    classes.length  > MAX_ITEMS ||
    groups.length   > MAX_ITEMS
  ) {
    return { error: "Trop d'éléments transmis." }
  }

  // ── 3. Validation UUID — excludeScheduleId ────────────────
  if (excludeScheduleId) {
    const result = safeParse(uuidSchema, excludeScheduleId)
    if (!result.success) {
      return { error: 'excludeScheduleId invalide.' }
    }
  }

  // ── 4. Validation des tableaux d'IDs ─────────────────────
  // Un UUID malformé dans ANY(...)::uuid[] provoque une erreur Postgres peu lisible.
  // On valide en amont pour retourner un message clair.
  const roomIds    = rooms.map((r) => r.id)
  const teacherIds = teachers.map((t) => t.id)
  const classIds   = classes.map((c) => c.id)
  const groupIds   = groups.map((g) => g.id)

  const arrayValidations = [
    { label: 'salle',      ids: roomIds },
    { label: 'professeur', ids: teacherIds },
    { label: 'classe',     ids: classIds },
    { label: 'groupe',     ids: groupIds },
  ]

  for (const { label, ids } of arrayValidations) {
    if (!ids.length) continue
    const result = safeParse(uuidArraySchema, ids)
    if (!result.success) {
      return { error: `Un ou plusieurs IDs de ${label} sont invalides.` }
    }
  }

  // ── 5. Court-circuit — rien à vérifier ───────────────────
  if (!rooms.length && !teachers.length && !classes.length && !groups.length) {
    return { data: { rooms: [], teachers: [], classes: [], groups: [] } }
  }

  // ── 6. Requête DB ─────────────────────────────────────────
  //
  // CONTRAINTES MÉTIER :
  // ✔ ROOM    — une salle ne peut contenir qu'un seul cours à la fois
  // ✔ TEACHER — un prof ne peut enseigner qu'un seul cours à la fois
  // ✔ CLASS   — une classe ne peut suivre qu'un seul cours à la fois
  // ✔ GROUP   — même logique que class, plus fine
  // ❌ COURSE — non bloquant (un même cours peut être donné en parallèle)
  // ✔ STATUS  — CANCELED et MISSED libèrent la ressource
  // ✔ SOFT DELETE — deletedAt != null ignoré
  const overlapping = await prismaClient.$queryRaw<
    Array<{
      roomId:    string
      teacherId: string | null
      classId:   string
      groupId:   string | null
    }>
  >(Prisma.sql`
    SELECT "roomId", "teacherId", "classId", "groupId"
    FROM "Schedule"
    WHERE "orgId"     = ${orgId}::uuid
      AND "deletedAt" IS NULL
      AND status NOT IN ('CANCELED', 'MISSED')
      AND (
            "roomId"    = ANY(${roomIds}::uuid[])
         OR "teacherId" = ANY(${teacherIds}::uuid[])
         OR "classId"   = ANY(${classIds}::uuid[])
         ${groupIds.length > 0
           ? Prisma.sql`OR "groupId" = ANY(${groupIds}::uuid[])`
           : Prisma.empty}
      )
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
  `)

  // ── 7. Sets O(1) ──────────────────────────────────────────
  const busyRoomIds    = new Set(overlapping.map((s) => s.roomId))
  const busyTeacherIds = new Set(
    overlapping.map((s) => s.teacherId).filter((id): id is string => id !== null),
  )
  const busyClassIds = new Set(overlapping.map((s) => s.classId))
  const busyGroupIds = new Set(
    overlapping.map((s) => s.groupId).filter((id): id is string => id !== null),
  )

  // ── 8. Mapping final ──────────────────────────────────────
  return {
    data: {
      rooms:    rooms.map((r)    => ({ id: r.id, available: !busyRoomIds.has(r.id) })),
      teachers: teachers.map((t) => ({ id: t.id, available: !busyTeacherIds.has(t.id) })),
      classes:  classes.map((c)  => ({ id: c.id, available: !busyClassIds.has(c.id) })),
      groups:   groups.map((g)   => ({ id: g.id, available: !busyGroupIds.has(g.id) })),
    },
  }
}

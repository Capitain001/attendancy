import type { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { markScheduleAbsences } from '@/services/attendance/database/attendance.mutations'

type CheckInRPCResult = {
  sessionId:     string
  checkIn:       string
  isLate:        boolean
  locationId:    string | null
  checkInMethod: string
}

/**
 * Délègue à la RPC teacher_check_in (PostGIS) :
 *   - vérifie GPS si room a une Location active (ST_DWithin)
 *   - crée Session + met à jour Schedule.confirmed atomiquement
 * coords = null → méthode ADMIN_OVERRIDE, pas de vérification GPS.
 */
export async function startSession(
  scheduleId: string,
  coords: { lat: number; lng: number } | null,
) {
  const lat    = coords?.lat ?? 0
  const lng    = coords?.lng ?? 0
  const method = coords ? 'GPS' : 'ADMIN_OVERRIDE'

  const [raw] = await prisma.$queryRaw<[{ teacher_check_in: CheckInRPCResult }]>`
    SELECT teacher_check_in(
      ${scheduleId}::uuid,
      ${lat}::double precision,
      ${lng}::double precision,
      ${method}::text
    )
  `
  const data = raw.teacher_check_in
  return {
    sessionId:     data.sessionId,
    checkIn:       new Date(data.checkIn),
    isLate:        data.isLate,
    locationId:    data.locationId,
    checkInMethod: data.checkInMethod,
  }
}

/**
 * Primitive de clôture : Session + Schedule → COMPLETED.
 * tx-aware — utilisable seule ou dans une transaction parente.
 * late-checkout → checkOut = schedule.endTime.
 */
export async function endSession(
  scheduleId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  const record = await tx.session.findUnique({
    where: { scheduleId },
    select: {
      id: true,
      checkIn: true,
      status: true,
      schedule: { select: { endTime: true } },
    },
  })
  if (!record)                        throw new Error('Session introuvable.')
  if (record.status === 'COMPLETED')  throw new Error('Session déjà terminée.')

  const now      = new Date()
  const endTime  = record.schedule.endTime
  const checkOut = now > endTime ? endTime : now
  const durationMinutes = record.checkIn
    ? Math.floor((checkOut.getTime() - record.checkIn.getTime()) / 60_000)
    : 0

  await tx.session.update({
    where: { id: record.id },
    data: { status: 'COMPLETED', checkOut, checkOutMethod: 'ADMIN_OVERRIDE', durationMinutes },
  })
  await tx.schedule.update({
    where: { id: scheduleId },
    data: { status: 'COMPLETED', statusChangedAt: now },
  })
  return { sessionId: record.id, checkOut, durationMinutes }
}

/**
 * Clôture métier complète atomique : clôture + marquage des absences.
 * Tout ou rien — rollback si le marquage échoue.
 */
export async function finalizeSession(scheduleId: string) {
  return prisma.$transaction(async tx => {
    const closed = await endSession(scheduleId, tx)
    const { absentUserIds, absentStudentIds, audience } = await markScheduleAbsences(scheduleId, tx)
    return { ...closed, absentUserIds, absentStudentIds, audience }
  })
}

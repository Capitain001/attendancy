// src/services/schedule/actions/schedule.mutations.ts
'use server'
import * as v from 'valibot'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import {
  createSchedule,
  updateSchedule,
  removeSchedule,
  restoreSchedule,
  markScheduleCreationNotified,
  getScheduleForNotify,
} from '../database'
import { CreateScheduleOutput, UpdateScheduleDataOutput, createScheduleSchema, updateScheduleSchema, UpdateScheduleInput } from '../validation'
import { logAuditAsync } from '@/modules/audit'
import { INVALID_TIME_ORDER_ERROR, isSlotElapsed, isValidTimeOrder, PAST_SLOT_ERROR } from '@/services/planning/policy' 
import { getExpectedAttendees } from '@/services/attendance/database'
import { notifyParentsForStudents } from '@/services/parent/notifications'
import { sendPushNotificationById } from '@/modules/notification/action'

const PLANNING_ROLES = "DIRECTION" as const;


/* à déplacer plus tard dans un service notification dédié — pour l'instant ça compile ici */

/**
 * Notif SCHEDULE_UPDATE (D12) — uniquement les changements qui modifient le
 * comportement de l'étudiant : salle, enseignant, horaire, annulation/report.
 * Best-effort, hors mutation : un échec de push n'annule pas l'update.
 */
async function notifyScheduleChange(
  scheduleId: string,
  orgId: string,
  changed: UpdateScheduleDataOutput,
  schedule: { startTime: Date; course: { name: string } },
) {
  const canceled = changed.status === 'CANCELED'
  const significant =
    canceled ||
    changed.roomId !== undefined ||
    changed.teacherId !== undefined ||
    changed.startTime !== undefined ||
    changed.endTime !== undefined
  if (!significant) return

  const day = format(schedule.startTime, 'EEEE d MMMM', { locale: fr })
  const message = canceled
    ? `Le cours ${schedule.course.name} du ${day} est annulé.`
    : `Le cours ${schedule.course.name} du ${day} a été modifié (salle, horaire ou enseignant).`

  try {
    const attendees = await getExpectedAttendees(scheduleId)
    const results = await Promise.allSettled(
      attendees.map((a) => sendPushNotificationById(a.userId, { message, type: 'SCHEDULE_UPDATE', scheduleId })),
    )
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) console.warn(`[notifyScheduleChange] ${failed} notif(s) non envoyée(s)`)

    await notifyParentsForStudents(
      attendees.map((a) => a.studentId),
      orgId,
      { message, type: 'SCHEDULE_UPDATE', scheduleId },
    )
  } catch (error) {
    console.warn('[notifyScheduleChange] émission échouée:', error)
  }
}

/**
 * Notif NEW_COURSE — annonce manuelle d'une séance créée (feature N).
 * Best-effort (push), hors transaction. Réutilise les attendus + parents.
 */
async function notifyScheduleCreation(
  scheduleId: string,
  orgId: string,
  schedule: { startTime: Date; course: { name: string } },
) {
  const day = format(schedule.startTime, 'EEEE d MMMM', { locale: fr })
  const message = `Nouveau cours : ${schedule.course.name} le ${day}.`
  try {
    const attendees = await getExpectedAttendees(scheduleId)
    const results = await Promise.allSettled(
      attendees.map((a) => sendPushNotificationById(a.userId, { message, type: 'NEW_COURSE', scheduleId })),
    )
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) console.warn(`[notifyScheduleCreation] ${failed} notif(s) non envoyée(s)`)

    await notifyParentsForStudents(
      attendees.map((a) => a.studentId),
      orgId,
      { message, type: 'NEW_COURSE', scheduleId },
    )
  } catch (error) {
    console.warn('[notifyScheduleCreation] émission échouée:', error)
  }
}

export async function createScheduleAction(data: CreateScheduleOutput) {
  const auth = await authAccess({ requiredRole: PLANNING_ROLES })
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  if (!isValidTimeOrder(data.startTime, data.endTime)) return { error: INVALID_TIME_ORDER_ERROR }
  if (isSlotElapsed({ start: data.startTime, end: data.endTime })) return { error: PAST_SLOT_ERROR }

  const parsed = v.safeParse(createScheduleSchema, data)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const schedule = await createSchedule({ ...parsed.output, orgId })

    logAuditAsync({
      userId: user.id,
      action: 'CREATE',
      resource: 'SCHEDULE',
      resourceId: schedule.id,
      orgId,
      details: { event: 'SCHEDULE_CREATED', courseName: schedule.course?.name ?? null, day: schedule.startTime },
    })

    return { data: schedule }
  } catch (error: unknown) {
    console.error('Erreur création schedule:', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function updateScheduleAction(input: UpdateScheduleInput) {
  const auth = await authAccess({ requiredRole: PLANNING_ROLES })
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  const parsed = v.safeParse(updateScheduleSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  const scheduleId = parsed.output.scheduleId
  const data = parsed.output.data

  if (data.startTime && data.endTime && isSlotElapsed({ start: data.startTime, end: data.endTime })) {
    return { error: PAST_SLOT_ERROR }
  }

  try {
    const schedule = await updateSchedule(scheduleId, orgId, data)
    await notifyScheduleChange(scheduleId, orgId, data, schedule)

    const canceled = data.status === 'CANCELED'
    const changedFields = (['roomId', 'teacherId', 'startTime', 'endTime'] as const)
      .filter((key) => data[key] !== undefined)

    if (canceled || changedFields.length > 0) {
      logAuditAsync({
        userId: user.id,
        action: canceled ? 'DELETE' : 'UPDATE',
        resource: 'SCHEDULE',
        resourceId: scheduleId,
        orgId,
        details: {
          event: canceled ? 'SCHEDULE_CANCELED' : 'SCHEDULE_UPDATED',
          courseName: schedule.course?.name ?? null,
          day: schedule.startTime,
          changes: changedFields,
        },
      })
    }

    return { data: schedule }
  } catch (error: unknown) {
    console.error('Erreur mise à jour schedule:', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function cancelScheduleAction(scheduleId: string) {
  const auth = await authAccess({ requiredRole: PLANNING_ROLES })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await updateSchedule(scheduleId, orgId, { status: 'CANCELED' })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeScheduleAction(scheduleId: string) {
  const auth = await authAccess({ requiredRole: PLANNING_ROLES })
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  try {
    const snapshot = await removeSchedule(scheduleId, orgId)

    logAuditAsync({
      userId: user.id,
      action: 'DELETE',
      resource: 'SCHEDULE',
      resourceId: scheduleId,
      orgId,
      details: { event: 'SCHEDULE_DELETED', courseName: snapshot.course?.name ?? null, day: snapshot.startTime },
    })

    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteScheduleAction(scheduleId: string) {
  return removeScheduleAction(scheduleId)
}

export async function restoreScheduleAction(scheduleId: string) {
  const auth = await authAccess({ requiredRole: PLANNING_ROLES })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await restoreSchedule(scheduleId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

/**
 * Envoi MANUEL de la notification de création (feature N) : NEW_COURSE → SENT.
 */
export async function notifyScheduleCreationAction(scheduleId: string) {
  const auth = await authAccess({ requiredRole: PLANNING_ROLES })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const schedule = await getScheduleForNotify(scheduleId, orgId)
    if (!schedule) throw new Error('Séance introuvable.')

    await notifyScheduleCreation(scheduleId, orgId, schedule)
    await markScheduleCreationNotified(scheduleId, orgId)

    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

/**
 * Envoi MANUEL en lot des notifications de création (« Tout notifier »).
 * Best-effort par séance ; renvoie le décompte succès/échecs.
 */
export async function notifyScheduleCreationsAction(scheduleIds: string[]) {
  const auth = await authAccess({ requiredRole: PLANNING_ROLES })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  let succeeded = 0
  let failed = 0

  for (const id of scheduleIds) {
    const schedule = await getScheduleForNotify(id, orgId)
    if (!schedule) {
      failed += 1
      continue
    }
    try {
      await notifyScheduleCreation(id, orgId, schedule)
      await markScheduleCreationNotified(id, orgId)
      succeeded += 1
    } catch {
      failed += 1
    }
  }

  return { data: { succeeded, failed } }
}
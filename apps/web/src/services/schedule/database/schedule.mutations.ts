// src/services/schedule/database/schedule.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateScheduleOutput, UpdateScheduleOutput } from '../validation'

const scheduleSelect = {
  course: { select: { id: true, name: true } },
  room: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  group: { select: { id: true, name: true } },
  teacher: {
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} as const

export async function createSchedule(data: CreateScheduleOutput & { orgId: string }) {
  // La classe est vérifiée explicitement : classId dénormalisé, doit rester scopé org.
  const cls = await prisma.class.findFirst({
    where: { id: data.classId, deletedAt: null, programTrack: { orgId: data.orgId } },
    select: { id: true },
  })
  if (!cls) throw new Error('Classe introuvable')

  const result = await tryConstraint(
    prisma.schedule.create({
      data: {
        courseId: data.courseId,
        classId: data.classId,
        orgId: data.orgId,
        roomId: data.roomId,
        teacherId: data.teacherId ?? null,
        groupId: data.groupId ?? null,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        notes: data.notes ?? null,
        confirmed: data.confirmed,
        notifyState: 'PENDING',
      },
      include: scheduleSelect,
    }),
  )

  await invalidateEvent('SCHEDULE_CREATED', data.orgId, data.classId)
  return result
}

export async function updateSchedule(scheduleId: string, orgId: string, data: UpdateScheduleOutput) {
  const schedule = await tryConstraint(
    prisma.schedule.update({
      where: { id: scheduleId, orgId, deletedAt: null },
      data,
      include: scheduleSelect,
    }),
  )

  // class.id vient de scheduleSelect, déjà chargé — pas de requête supplémentaire.
  await invalidateEvent('SCHEDULE_UPDATED', orgId, schedule.class?.id ?? scheduleId)
  return schedule
}

export async function removeSchedule(scheduleId: string, orgId: string) {
  const schedule = await tryConstraint(
    prisma.schedule.update({
      where: { id: scheduleId, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
      include: scheduleSelect,
    }),
  )

  await invalidateEvent('SCHEDULE_REMOVED', orgId, schedule.class?.id ?? scheduleId)
  return schedule
}

export async function restoreSchedule(scheduleId: string, orgId: string) {
  const schedule = await tryConstraint(
    prisma.schedule.update({
      where: { id: scheduleId, orgId, deletedAt: { not: null } },
      data: { deletedAt: null },
      include: scheduleSelect,
    }),
  )

  await invalidateEvent('SCHEDULE_CREATED', orgId, schedule.class?.id ?? scheduleId)
  return schedule
}

/**
 * Marque la notification de création comme envoyée (feature N) — scopé orgId.
 */
export async function markScheduleCreationNotified(scheduleId: string, orgId: string) {
  await tryConstraint(
    prisma.schedule.update({
      where: { id: scheduleId, orgId },
      data: { notifyState: 'SENT', notifiedAt: new Date() },
    }),
  )
}

/**
 * Lecture minimale pour l'envoi de notification (création ou update) — scopé orgId.
 */
export async function getScheduleForNotify(scheduleId: string, orgId: string) {
  return prisma.schedule.findFirst({
    where: { id: scheduleId, orgId, deletedAt: null },
    select: {
      startTime: true,
      course: { select: { name: true } },
    },
  })
}

/* =========================
   RÉCURRENCE (weekRecurrenceId)
========================= */

export async function deleteSchedulesByRule(ruleId: string, orgId: string) {
  const affected = await prisma.schedule.findMany({
    where: { weekRecurrenceId: ruleId, orgId, deletedAt: null },
    select: { classId: true },
    distinct: ['classId'],
  })

  await prisma.schedule.deleteMany({
    where: { weekRecurrenceId: ruleId, orgId },
  })

  await Promise.all(affected.map(({ classId }) => invalidateEvent('SCHEDULE_REMOVED', orgId, classId)))
}

export async function deleteNextSchedulesByRule(ruleId: string, orgId: string) {
  const affected = await prisma.schedule.findMany({
    where: {
      weekRecurrenceId: ruleId,
      orgId,
      startTime: { gte: new Date() },
      status: 'PENDING',
      confirmed: false,
      deletedAt: null,
    },
    select: { classId: true },
    distinct: ['classId'],
  })

  await prisma.schedule.deleteMany({
    where: {
      weekRecurrenceId: ruleId,
      orgId,
      startTime: { gte: new Date() },
      status: 'PENDING',
      confirmed: false,
    },
  })

  await Promise.all(affected.map(({ classId }) => invalidateEvent('SCHEDULE_REMOVED', orgId, classId)))
}
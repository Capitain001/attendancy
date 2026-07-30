// src/services/schedule/database/schedule.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateScheduleOutput } from '../validation'

const scheduleInclude = {
  course:  { select: { id: true, name: true } },
  room:    { select: { id: true, name: true } },
  class:   { select: { id: true, name: true } },
  group:   { select: { id: true, name: true } },
  teacher: {
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} as const

export async function createSchedule(data: CreateScheduleOutput & { orgId: string }) {
  // Verify class belongs to org (classId denormalized but still must be validated)
  const cls = await prisma.class.findFirst({
    where: { id: data.classId, deletedAt: null, programTrack: { orgId: data.orgId } },
    select: { id: true },
  })
  if (!cls) throw new Error('Classe introuvable')


  const result = await tryConstraint(
    prisma.schedule.create({
      data: {
        courseId:  data.courseId,
        classId:   data.classId,
        orgId:     data.orgId,
        roomId:    data.roomId,
        teacherId: data.teacherId ?? null,
        groupId:   data.groupId  ?? null,
        startTime: new Date(data.startTime),
        endTime:   new Date(data.endTime),
        notes:     data.notes ?? null,
        notifyState: 'PENDING',
      },
      include: scheduleInclude,
    }),
  )
  await invalidateEvent('SCHEDULE_CREATED', data.orgId, data.classId)
  return result
}

export async function updateSchedule(
  scheduleId: string,
  orgId: string,
  data: {
    roomId?:    string
    teacherId?: string
    startTime?: string
    endTime?:   string
    notes?:     string
    confirmed?: boolean
    status?:    'PENDING' | 'COMPLETED' | 'CANCELED' | 'MISSED'
  },
) {
  // Get classId for cache invalidation (updateMany doesn't return it)
  const existing = await prisma.schedule.findFirst({
    where: { id: scheduleId, orgId, deletedAt: null },
    select: { classId: true },
  })
  if (!existing) throw new Error('Séance introuvable')

  const { count } = await tryConstraint(
    prisma.schedule.updateMany({
      where: { id: scheduleId, orgId, deletedAt: null },
      data: {
        ...(data.roomId    !== undefined ? { roomId:    data.roomId }               : {}),
        ...(data.teacherId !== undefined ? { teacherId: data.teacherId }             : {}),
        ...(data.startTime !== undefined ? { startTime: new Date(data.startTime) }  : {}),
        ...(data.endTime   !== undefined ? { endTime:   new Date(data.endTime) }    : {}),
        ...(data.notes     !== undefined ? { notes:     data.notes }                : {}),
        ...(data.confirmed !== undefined ? { confirmed: data.confirmed }             : {}),
        ...(data.status    !== undefined ? { status:    data.status, statusChangedAt: new Date() } : {}),
      },
    }),
  )
  if (count === 0) throw new Error('Séance introuvable ou hors organisation')

  await invalidateEvent('SCHEDULE_UPDATED', orgId, existing.classId)
  return { id: scheduleId }
}

export async function removeSchedule(scheduleId: string, orgId: string) {
  const existing = await prisma.schedule.findFirst({
    where: { id: scheduleId, orgId, deletedAt: null },
    select: { classId: true },
  })
  if (!existing) throw new Error('Séance introuvable')

  await prisma.schedule.updateMany({
    where: { id: scheduleId, orgId, deletedAt: null },
    data:  { deletedAt: new Date() },
  })
  await invalidateEvent('SCHEDULE_REMOVED', orgId, existing.classId)
}

export async function restoreSchedule(scheduleId: string, orgId: string) {
  const existing = await prisma.schedule.findFirst({
    where: { id: scheduleId, orgId },
    select: {
      classId: true,
      course:   { select: { id: true, name: true } },
      room:     { select: { id: true, name: true } },
      class:    { select: { id: true, name: true } },
      group:    { select: { id: true, name: true } },
      teacher:  { select: { id: true, user: { select: { firstName: true, lastName: true, avatar_url: true } } } },
    },
  })
  if (!existing) throw new Error('Séance introuvable')

  await prisma.schedule.update({
    where: { id: scheduleId },
    data:  { deletedAt: null },
  })
  await invalidateEvent('SCHEDULE_CREATED', orgId, existing.classId)
  return existing
}

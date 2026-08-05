import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateEventInput, UpdateEventInput } from '../validation'

export async function createEvent(orgId: string, userId: string, data: CreateEventInput) {
  const record = await tryConstraint(
    prisma.event.create({
      data: {
        orgId,
        createdById: userId,
        title:       data.title,
        description: data.description ?? null,
        startTime:   data.startTime ?? null,
        endTime:     data.endTime   ?? null,
        location:    data.location  ?? null,
        type:        data.type ?? 'GENERAL',
        targetRoles: data.targetRoles ?? [],
        color:       data.color    ?? null,
        isPublic:    data.isPublic ?? false,
      },
      select: { id: true, title: true },
    })
  )
  invalidateEvent('EVENT_CREATED', orgId)
  return record
}

export async function updateEvent(eventId: string, orgId: string, data: UpdateEventInput) {
  const record = await tryConstraint(
    prisma.event.update({
      where: { id: eventId, orgId },
      data: {
        ...(data.title       !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startTime   !== undefined && { startTime: data.startTime }),
        ...(data.endTime     !== undefined && { endTime: data.endTime }),
        ...(data.location    !== undefined && { location: data.location }),
        ...(data.type        !== undefined && { type: data.type }),
        ...(data.targetRoles !== undefined && { targetRoles: data.targetRoles }),
        ...(data.color       !== undefined && { color: data.color }),
        ...(data.isPublic    !== undefined && { isPublic: data.isPublic }),
      },
      select: { id: true },
    })
  )
  invalidateEvent('EVENT_UPDATED', orgId, eventId)
  return record
}

export async function removeEventDb(eventId: string, orgId: string) {
  await prisma.event.update({
    where: { id: eventId, orgId },
    data:  { deletedAt: new Date() },
  })
  invalidateEvent('EVENT_REMOVED', orgId, eventId)
}

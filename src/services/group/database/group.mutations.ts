// src/services/group/database/group.mutations.ts
import { prisma } from '@/lib/db'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateGroupOutput } from '../validation'

export async function createGroup(data: CreateGroupOutput & { orgId: string }) {
  const cls = await prisma.class.findFirst({
    where: { id: data.classId, deletedAt: null, programTrack: { orgId: data.orgId } },
    select: { id: true },
  })
  if (!cls) throw new Error('Classe introuvable')

  const result = await tryConstraint(prisma.group.create({
    data: { name: data.name, description: data.description, classId: data.classId },
    select: { id: true, name: true, description: true },
  }))
  await invalidateEvent('GROUP_CREATED', data.orgId, data.classId)
  return result
}

// Soft delete — préserve l'historique des séances liées (Schedule.groupId SetNull bloqué par Restrict)

export async function removeGroup(groupId: string, orgId: string) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, deletedAt: null, class: { programTrack: { orgId } } },
    select: { id: true, classId: true },
  })
  if (!group) throw new Error('Groupe introuvable')

  await tryConstraint(prisma.group.update({
    where: { id: groupId },
    data:  { deletedAt: new Date() },
    select: { id: true },
  }))
  await invalidateEvent('GROUP_DELETED', orgId, group.classId)
  return { id: group.id }
}
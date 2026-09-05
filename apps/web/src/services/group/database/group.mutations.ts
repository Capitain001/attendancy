// src/services/group/database/group.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateGroupOutput, UpdateGroupOutput, SetGroupStudentsOutput } from '../validation'

// select partagé — aligne la forme retournée par create/update sur getGroupsByClass
const groupRowSelect = {
  id: true, name: true, description: true,
  _count: { select: { studentGroups: true } },
} as const

export async function createGroup(data: CreateGroupOutput & { orgId: string }) {
  const cls = await prisma.class.findFirst({
    where: { id: data.classId, deletedAt: null, programTrack: { orgId: data.orgId } },
    select: { id: true },
  })
  if (!cls) throw new Error('Classe introuvable')

  const result = await tryConstraint(prisma.group.create({
    data: { name: data.name, description: data.description, classId: data.classId },
    select: groupRowSelect,
  }))
  await invalidateEvent('GROUP_CREATED', data.orgId, data.classId)
  return result
}

// Renommer / redescription — ownership via class.programTrack.orgId dans le where.
export async function updateGroup(data: UpdateGroupOutput & { orgId: string }) {
  const result = await tryConstraint(prisma.group.update({
    where: {
      id: data.groupId,
      deletedAt: null,
      class: { programTrack: { orgId: data.orgId } },
    },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
    select: groupRowSelect,
  }))
  await invalidateEvent('GROUP_UPDATED', data.orgId, data.classId)
  return result
}

// Set transactionnel des membres — remplace l'ensemble des StudentGroup du groupe.
export async function setGroupStudents(data: SetGroupStudentsOutput & { orgId: string }) {
  const group = await prisma.group.findFirst({
    where: {
      id: data.groupId,
      deletedAt: null,
      classId: data.classId,
      class: { programTrack: { orgId: data.orgId } },
    },
    select: { id: true },
  })
  if (!group) throw new Error('Groupe introuvable')

  await tryConstraint(prisma.$transaction([
    prisma.studentGroup.deleteMany({ where: { groupId: data.groupId } }),
    prisma.studentGroup.createMany({
      data: data.enrollmentIds.map((enrollmentId) => ({ enrollmentId, groupId: data.groupId })),
      skipDuplicates: true,
    }),
  ]))
  await invalidateEvent('GROUP_UPDATED', data.orgId, data.classId)
  return { id: data.groupId }
}

// Soft delete — préserve l'historique des séances liées (Schedule.groupId SetNull bloqué par Restrict)

export async function removeGroup(groupId: string, orgId: string) {
  const updated = await tryConstraint(prisma.group.update({
    where: {
      id: groupId,
      deletedAt: null,
      class: { programTrack: { orgId } },
    },
    data: { deletedAt: new Date() },
    select: { classId: true },
  }))

  await invalidateEvent('GROUP_REMOVED', orgId, updated.classId)
  return { id: groupId }
}

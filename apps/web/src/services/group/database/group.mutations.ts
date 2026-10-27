//
// src/services/group/database/group.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/graph'
import type {
  CreateGroupOutput,
  UpdateGroupOutput,
  SetGroupStudentsOutput,
  AddStudentsToGroupOutput,
} from '../validation'


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

// Récupère les ids des inscriptions de ces étudiants dans la classe.
// Flux nécessaire : StudentGroup relie une INSCRIPTION à un groupe, pas un
// étudiant ; il faut donc récupérer les enrollmentId avant d'écrire.
// Seules les inscriptions en cours comptent (endedAt null). L'org est garantie
// par le scope de la classe. Un étudiant sans inscription en cours n'a aucune
// ligne ici : il est simplement absent du résultat.
async function getStudentEnrollmentsIds(classId: string, orgId: string, studentIds: string[]) {
  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      classId,
      endedAt: null,
      studentId: { in: studentIds },
      class: { programTrack: { orgId } },
    },
    select: { id: true },
  })
  return enrollments.map((e) => e.id)
}

// Ajoute à un groupe des étudiants déjà inscrits dans la classe.
// L'inscription dans la classe n'est PAS gérée ici : c'est une autre fonction.
//
// Idempotent : un étudiant déjà dans le groupe est ignoré (skipDuplicates).
//
// classId est fourni en plus de groupId, même si un groupe n'a qu'une classe :
// il scope l'org et la récupération des inscriptions SANS relire le groupe, et
// il cible l'invalidation du cache (tags par classe). Même convention que
// setGroupStudents. Un classId incohérent avec groupId est refusé par le trigger.
// Pas de lecture du groupe : le trigger validate_student_class_group refuse
// tout groupe qui n'appartient pas à la classe de l'inscription.
export async function addStudentsToGroup(data: AddStudentsToGroupOutput & { orgId: string }) {
  const { orgId, classId, groupId, studentIds } = data

  // 1. Récupérer les inscriptions des étudiants (le pont vers StudentGroup).
  const enrollmentIds = await getStudentEnrollmentsIds(classId, orgId, studentIds)

  // 2. Affecter ces inscriptions au groupe : une seule écriture, donc pas de transaction.
  const { count } = await tryConstraint(prisma.studentGroup.createMany({
    data: enrollmentIds.map((enrollmentId) => ({ enrollmentId, groupId })),
    skipDuplicates: true,
  }))

  // 3. Invalider le cache de la classe, APRÈS l'écriture.
  await invalidateEvent('GROUP_UPDATED', orgId, classId)

  // addedToGroup = étudiants réellement ajoutés (hors déjà présents et hors non-inscrits).
  return { groupId, addedToGroup: count }
}

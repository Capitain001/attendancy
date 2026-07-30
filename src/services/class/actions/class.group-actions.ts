'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/key'

type GroupRow = {
  id: string
  name: string
  description: string | null
  _count: { studentGroups: number }
}

export async function getClassGroupsAction(input: { classId: string }) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const [groups, cls] = await Promise.all([
      prisma.group.findMany({
        where: { classId: input.classId, deletedAt: null, class: { programTrack: { orgId } } },
        select: { id: true, name: true, description: true, _count: { select: { studentGroups: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.class.findUnique({
        where: { id: input.classId },
        select: { id: true, name: true },
      }),
    ])

    return { data: { groups, class: cls } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getGroupEligibleStudentsAction(input: { classId: string; groupId: string }) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        classId: input.classId,
        class: { programTrack: { orgId } },
        studentGroups: { none: { groupId: input.groupId } },
      },
      select: {
        id: true,
        student: {
          select: {
            id: true,
            userId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    return { data: { students: enrollments } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function createClassGroupAction(input: { classId: string; name: string; description?: string }) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const group = await prisma.group.create({
      data: { name: input.name, description: input.description ?? null, classId: input.classId },
      select: { id: true, name: true, description: true, _count: { select: { studentGroups: true } } },
    })
    await invalidateEvent('GROUP_CREATED', orgId, input.classId)
    return { data: group as GroupRow }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateClassGroupAction(input: { classId: string; groupId: string; name?: string; description?: string | null }) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const group = await prisma.group.update({
      where: { id: input.groupId, classId: input.classId },
      data: { ...(input.name !== undefined && { name: input.name }), ...(input.description !== undefined && { description: input.description }) },
      select: { id: true, name: true, description: true, _count: { select: { studentGroups: true } } },
    })
    await invalidateEvent('GROUP_UPDATED', orgId, input.classId)
    return { data: group as GroupRow }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteClassGroupAction(input: { classId: string; groupId: string }) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    await prisma.group.update({
      where: { id: input.groupId, classId: input.classId },
      data: { deletedAt: new Date() },
    })
    await invalidateEvent('GROUP_REMOVED', orgId, input.classId)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function setGroupStudentsAction(input: { classId: string; groupId: string; enrollmentIds: string[] }) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    await prisma.$transaction([
      prisma.studentGroup.deleteMany({ where: { groupId: input.groupId } }),
      prisma.studentGroup.createMany({
        data: input.enrollmentIds.map((enrollmentId) => ({ enrollmentId, groupId: input.groupId })),
        skipDuplicates: true,
      }),
    ])
    await invalidateEvent('GROUP_UPDATED', orgId, input.classId)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

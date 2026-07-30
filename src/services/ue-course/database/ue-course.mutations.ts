// src/services/ue-course/database/ue-course.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateUECourseOutput } from '../validation'

export async function createUECourse(data: CreateUECourseOutput & { orgId: string }) {
  const result = await tryConstraint(prisma.uECourse.create({
    data: {
      name:        data.name,
      code:        data.code,
      description: data.description,
      credits:     data.credits,
      duration:    data.duration,
      ueId:        data.ueId,
      orgId:       data.orgId,
    },
    select: { id: true, name: true, code: true, ueId: true },
  }))
  await invalidateEvent('UE_COURSE_CREATED', data.orgId, data.ueId)
  return result
}

export type UpdateUECourseData = {
  name?: string
  code?: string
  description?: string | null
  credits?: number
  duration?: number
}

export async function updateUECourse(ueCourseId: string, orgId: string, data: UpdateUECourseData) {
  const result = await tryConstraint(prisma.uECourse.update({
    where: { id: ueCourseId, orgId },
    data,
    select: { id: true, name: true, code: true, ueId: true },
  }))
  await invalidateEvent('UE_COURSE_UPDATED', orgId, result.ueId)
  return result
}

export async function removeUECourse(ueCourseId: string, orgId: string) {
  const result = await tryConstraint(prisma.uECourse.update({
    where: { id: ueCourseId, orgId },
    data:  { deletedAt: new Date() },
    select: { id: true, ueId: true },
  }))
  await invalidateEvent('UE_COURSE_REMOVED', orgId, result.ueId)
  return result
}

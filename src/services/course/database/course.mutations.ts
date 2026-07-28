// src/services/course/database/course.mutations.ts
import { prisma } from '@/lib/db'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateCourseOutput, AssignTeacherOutput } from '../validation'

export async function createCourse(data: CreateCourseOutput & { orgId: string }) {
  // Verify class belongs to org
  const cls = await prisma.class.findFirst({
    where: { id: data.classId, deletedAt: null, programTrack: { orgId: data.orgId } },
    select: { id: true },
  })
  if (!cls) throw new Error('Classe introuvable')

  // Get UECourse info to populate course fields
  const ueCourse = await prisma.uECourse.findFirst({
    where: { id: data.ueCourseId, orgId: data.orgId, deletedAt: null },
    select: { name: true, credits: true, duration: true },
  })
  if (!ueCourse) throw new Error('Matière introuvable')

  // Check partial unique index (classId, ueCourseId) WHERE deletedAt IS NULL
  const existing = await prisma.course.findFirst({
    where: { classId: data.classId, ueCourseId: data.ueCourseId, deletedAt: null },
    select: { id: true },
  })
  if (existing) throw new Error('Ce cours existe déjà pour cette classe')

  const result = await tryConstraint(prisma.course.create({
    data: {
      name:          data.name ?? ueCourse.name,
      credits:       ueCourse.credits,
      durationTotal: ueCourse.duration,
      ueCourseId:    data.ueCourseId,
      classId:       data.classId,
      orgId:         data.orgId,
      ...(data.termId ? { termId: data.termId } : {}),
    },
    select: { id: true, name: true, credits: true },
  }))
  await invalidateEvent('COURSE_CREATED', data.orgId, data.classId)
  return result
}

export async function assignTeacher(data: AssignTeacherOutput & { orgId: string }) {
  // Verify course belongs to org
  const course = await prisma.course.findFirst({
    where: { id: data.courseId, orgId: data.orgId, deletedAt: null },
    select: { id: true, classId: true },
  })
  if (!course) throw new Error('Cours introuvable')

  const result = await tryConstraint(prisma.courseTeacher.create({
    data: {
      courseId:  data.courseId,
      teacherId: data.teacherId,
      isMain:    data.isMain ?? false,
      hours:     data.hours,
    },
    select: { id: true, isMain: true },
  }))
  await invalidateEvent('COURSE_UPDATED', data.orgId, course.classId)
  return result
}

export async function removeTeacherFromCourse(courseTeacherId: string, orgId: string) {
  await tryConstraint(prisma.courseTeacher.delete({
    where: { id: courseTeacherId },
  }))
  await invalidateEvent('COURSE_UPDATED', orgId, courseTeacherId)
  return { id: courseTeacherId }
}

// src/services/course-teacher/database/course-teacher.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import { getCourseClassId } from '@/services/course/database'
import type { AssignTeacherOutput } from '../validation'

export async function assignTeacher(data: AssignTeacherOutput & { orgId: string }) {
  const course = await getCourseClassId(data.courseId, data.orgId)
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
  await invalidateEvent('COURSE_TEACHER_CREATED', data.orgId, data.courseId, course.classId)
  return result
}

export async function deleteTeacherFromCourse(courseTeacherId: string, orgId: string) {
  const ct = await prisma.courseTeacher.findFirst({
    where: { id: courseTeacherId, course: { orgId } },
    select: { courseId: true, course: { select: { classId: true } } },
  })
  if (!ct) throw new Error('Affectation introuvable')

  await tryConstraint(prisma.courseTeacher.delete({ where: { id: courseTeacherId } }))
  await invalidateEvent('COURSE_TEACHER_DELETED', orgId, ct.courseId, ct.course.classId)
  return { id: courseTeacherId }
}

/**
 * Remplace intégralement les affectations d'un cours : un principal (optionnel)
 * + une liste d'assistants — en une transaction (deleteMany puis recreate).
 */
export async function syncCourseTeachers(
  courseId: string,
  principalId: string,
  assistantIds: string[],
  orgId: string,
) {
  const course = await getCourseClassId(courseId, orgId)
  if (!course) throw new Error('Cours introuvable')

  await prisma.$transaction(async (tx) => {
    await tx.courseTeacher.deleteMany({ where: { courseId } })
    if (principalId) {
      await tx.courseTeacher.create({
        data: { courseId, teacherId: principalId, isMain: true },
      })
    }
    for (const teacherId of assistantIds) {
      await tx.courseTeacher.create({
        data: { courseId, teacherId, isMain: false },
      })
    }
  })
  await invalidateEvent('COURSE_TEACHER_UPDATED', orgId, courseId, course.classId)
}

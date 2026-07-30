// src/services/student/database/student.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { EnrollStudentOutput, AssignStudentGroupOutput } from '../validation'

export async function enrollStudent(data: EnrollStudentOutput & { orgId: string }) {
  // Verify student belongs to org
  const student = await prisma.student.findFirst({
    where: { id: data.studentId, orgId: data.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!student) throw new Error('Étudiant introuvable dans cette organisation')

  // Verify class belongs to org
  const cls = await prisma.class.findFirst({
    where: { id: data.classId, deletedAt: null, programTrack: { orgId: data.orgId } },
    select: { id: true },
  })
  if (!cls) throw new Error('Classe introuvable')

  const result = await tryConstraint(prisma.studentEnrollment.create({
    data: { studentId: data.studentId, classId: data.classId },
    select: { id: true, studentId: true, classId: true },
  }))
  await invalidateEvent('STUDENT_ENROLLED', data.orgId, data.classId)
  return result
}

export async function removeEnrollment(enrollmentId: string, orgId: string) {
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { id: enrollmentId, class: { programTrack: { orgId } } },
    select: { id: true, classId: true },
  })
  if (!enrollment) throw new Error('Inscription introuvable')

  await tryConstraint(prisma.studentEnrollment.update({
    where: { id: enrollmentId },
    data:  { endedAt: new Date() },
    select: { id: true },
  }))
  await invalidateEvent('STUDENT_UNENROLLED', orgId, enrollment.classId)
  return { id: enrollmentId }
}

export async function assignStudentGroup(data: AssignStudentGroupOutput & { orgId: string }) {
  // Verify enrollment belongs to org
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { id: data.enrollmentId, class: { programTrack: { orgId: data.orgId } } },
    select: { id: true, classId: true },
  })
  if (!enrollment) throw new Error('Inscription introuvable')

  // Verify group belongs to same class
  const group = await prisma.group.findFirst({
    where: { id: data.groupId, classId: enrollment.classId, deletedAt: null },
    select: { id: true },
  })
  if (!group) throw new Error('Groupe introuvable dans cette classe')

  const result = await tryConstraint(prisma.studentGroup.create({
    data: { enrollmentId: data.enrollmentId, groupId: data.groupId },
    select: { id: true },
  }))
  await invalidateEvent('STUDENT_GROUP_ASSIGNED', data.orgId, enrollment.classId)
  return result
}

export async function deleteStudentGroup(studentGroupId: string, orgId: string) {
  const sg = await prisma.studentGroup.findFirst({
    where: {
      id: studentGroupId,
      enrollment: { class: { programTrack: { orgId } } },
    },
    select: { id: true, enrollment: { select: { classId: true } } },
  })
  if (!sg) throw new Error('Affectation groupe introuvable')

  await tryConstraint(prisma.studentGroup.delete({
    where: { id: studentGroupId },
    select: { id: true },
  }))
  await invalidateEvent('STUDENT_GROUP_ASSIGNED', orgId, sg.enrollment.classId)
  return { id: studentGroupId }
}

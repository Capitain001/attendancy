// src/services/teacher/database/teacher.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'

export async function updateTeacherDepartment(
  teacherId: string,
  departmentId: string | null | undefined,
  orgId: string,
) {
  const result = await tryConstraint(prisma.teacher.update({
    where: { id: teacherId, orgId },
    data:  { departmentId: departmentId ?? null },
    select: { id: true, departmentId: true },
  }))
  await invalidateEvent('TEACHER_UPDATED', orgId, teacherId)
  return result
}

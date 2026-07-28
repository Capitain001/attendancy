import type { Prisma } from '@/generated/prisma/client'

export const activeEnrollmentWhere = {
  endedAt: null,
  student: { deletedAt: null },
} satisfies Prisma.StudentEnrollmentWhereInput

export const activeGroupMemberWhere = {
  enrollment: activeEnrollmentWhere,
} satisfies Prisma.StudentGroupWhereInput

import { prisma } from '@/lib/prisma'
import type { PrismaClient, Prisma } from '@/generated/prisma/client'
import type { PersonalSignupRole } from '@/modules/auth/constants'

type Db = PrismaClient | Prisma.TransactionClient

// Lecture pure : évite un doublon (@@unique([userId, orgId]) sur Teacher/Student/Parent).
export async function findPersonalProfileId(
  userId: string,
  orgId: string,
  role: PersonalSignupRole,
  db: Db = prisma,
) {
  switch (role) {
    case 'TEACHER':
      return (await db.teacher.findFirst({ where: { userId, orgId }, select: { id: true } }))?.id ?? null
    case 'STUDENT':
      return (await db.student.findFirst({ where: { userId, orgId }, select: { id: true } }))?.id ?? null
    case 'PARENT':
      return (await db.parent.findFirst({ where: { userId, orgId }, select: { id: true } }))?.id ?? null
  }
}
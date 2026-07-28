// src/services/auth/members/utils.ts
// Helpers de transaction pour le flow completeSignup.
// Ces fonctions opèrent DANS une transaction Prisma — ne pas appeler hors tx.
import type { PrismaClient, Role } from '@/generated/prisma/client'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

// Crée l'entité profil spécifique au rôle (Teacher, Student, Parent, Direction…).
// ⚠ À ÉTENDRE PAR PROJET — ajouter un case par rôle qui porte un profil DB.
export async function createRoleSpecificEntity(
  tx: Tx,
  userId: string,
  role: Role,
  orgId: string,
  departmentId?: string | null
) {
  switch (role) {
    case 'TEACHER':
      return tx.teacher.create({
        data: { userId, orgId, departmentId: departmentId ?? undefined },
      })

    case 'STUDENT':
      return tx.student.create({ data: { userId, orgId } })

    case 'PARENT':
      return tx.parent.create({ data: { userId, orgId } })

    case 'DIRECTION':
      return tx.direction.create({ data: { userId, orgId } })

    case 'ADMIN':
    case 'SUPER_ADMIN':
      // Admin reste global — pas de scope org sur ce profil.
      return tx.admin.create({ data: { userId } })

    default:
      return null
  }
}

// Assigne une fonction à un utilisateur (idempotent sur le doublon).
// Dépend de ensureMainFunctions(orgId) — appeler avant si les fonctions
// n'ont pas encore été initialisées pour cette org.
// TODO: dépendance ensureMainFunctions — à implémenter dans services/org/ ou services/function/
export async function assignFunctionToUser(
  tx: Tx,
  userId: string,
  orgId: string,
  functionName?: string,
  assignedBy?: string | null
) {
  if (!functionName) return null

  const fn = await tx.function.findUnique({
    where: { name_orgId: { name: functionName, orgId } },
    select: { id: true },
  })

  if (!fn) return null

  const existing = await tx.userFunction.findUnique({
    where: { userId_functionId: { userId, functionId: fn.id } },
  })

  if (existing) return existing

  return tx.userFunction.create({
    data: { userId, functionId: fn.id, assignedBy: assignedBy ?? null },
    select: { id: true, userId: true, functionId: true },
  })
}

// Assigne plusieurs fonctions — délègue à assignFunctionToUser.
export async function assignMultipleFunctionsToUser(
  tx: Tx,
  userId: string,
  orgId: string,
  functionNames: string[],
  assignedBy?: string | null
) {
  if (functionNames.length === 0) return []
  const results = []
  for (const name of functionNames) {
    const r = await assignFunctionToUser(tx, userId, orgId, name, assignedBy)
    if (r) results.push(r)
  }
  return results
}

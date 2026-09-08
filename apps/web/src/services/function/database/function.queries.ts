// src/services/function/database/function.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'
import { MAIN_FUNCTIONS } from '../constants'

export async function getFunctions(orgId: string) {
  'use cache'
  cacheTag(CACHE.FUNCTION(orgId))
  cacheLife(CACHE.FUNCTION.life)
  return prisma.function.findMany({
    where: { orgId },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      isMain: true,
      _count: { select: { users: true } },
    },
    orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
  })
}

export async function getFunctionByName(name: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.FUNCTION(orgId))
  cacheLife(CACHE.FUNCTION.life)
  return prisma.function.findUnique({
    where: { name_orgId: { name, orgId } },
    select: { id: true, name: true, description: true, icon: true, isMain: true },
  })
}

export async function getFunctionsByNames(names: string[], orgId: string) {
  'use cache'
  cacheTag(CACHE.FUNCTION(orgId))
  cacheLife(CACHE.FUNCTION.life)
  return prisma.function.findMany({
    where: { orgId, name: { in: names } },
    select: { id: true, name: true },
  })
}



/**
 * Récupère les profils utilisateurs associés à une fonction
 * Retourne les informations de l'utilisateur, de la fonction, et les métadonnées d'assignation
 */
export async function getFunctionProfiles({
  functionId,
  orgId,
}: {
  functionId: string;
  orgId: string;
}) {
  "use cache";
  cacheTag(CACHE.FUNCTION(orgId, functionId));
  cacheLife("minutes");

  return prisma.userFunction.findMany({
    where: { functionId },
    select: {
      id: true,
      assignedAt: true,
      assignedBy: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar_url: true,
          status: true,
          dateOfBirth: true,
          sex: true,
          createdAt: true,
          details: true,
        },
      },
      function: {
        select: {
          name: true,
          isMain: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });
}



// ─── Merge V1 (getFunctionsByUser) ──────────────────────────────────────────
// Symétrique de getFunctionProfiles. orgId ajouté (absent en V1) : le scoping
// multi-tenant strict passe par le where, pas par confiance dans functionId.
export async function getUserFunctions({ userId, orgId }: { userId: string; orgId: string }) {
  'use cache'
  cacheTag(CACHE.USER_FUNCTIONS(orgId, userId))
  cacheLife(CACHE.FUNCTION.life)
  return prisma.userFunction.findMany({
    where: { userId, function: { orgId } },
    select: {
      id: true,
      assignedAt: true,
      assignedBy: true,
      function: { select: { id: true, name: true, description: true, icon: true, isMain: true } },
    },
    orderBy: { assignedAt: 'desc' },
  })
}

// ─── Merge V1 (hasAllMainFunctions / getMissingMainFunctions) ──────────────
// PAS de "use cache" : ces lectures gardent ensureMainFunctions (mutation).
// Une lecture périmée romprait la garde et recréerait/skipperait à tort.
export async function checkExistingMainFunctions(orgId: string) {
  const existing = await prisma.function.findMany({
    where: { orgId, isMain: true },
    select: { name: true },
  })
  const existingNames = new Set(existing.map((f) => f.name))
  return MAIN_FUNCTIONS.every((f) => existingNames.has(f.name))
}

export async function getMissingMainFunctions(orgId: string) {
  const existing = await prisma.function.findMany({
    where: { orgId, isMain: true },
    select: { name: true },
  })
  const existingNames = new Set(existing.map((f) => f.name))
  return MAIN_FUNCTIONS.filter((f) => !existingNames.has(f.name)).map((f) => f.name)
}

export async function getFunctionDetail(functionId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.FUNCTION(orgId, functionId))
  cacheLife(CACHE.FUNCTION.life)
  return prisma.function.findUnique({
    where: { id: functionId, orgId },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      isMain: true,
      createdAt: true,
      _count: { select: { users: true, permissions: true } },
      permissions: {
        where: { isActive: true },
        select: { id: true, action: true, resource: true, resourceId: true, description: true, expiresAt: true },
        orderBy: { createdAt: 'desc' },
      },
      users: {
        select: {
          id: true,
          assignedAt: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatar_url: true, status: true } },
          assignedByUser: { select: { id: true, firstName: true, lastName: true, avatar_url: true } },
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  })
}



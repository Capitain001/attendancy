// src/services/function/database/function.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

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

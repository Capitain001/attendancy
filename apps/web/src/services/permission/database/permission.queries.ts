import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'
import { permissionName } from '../utils'

const activeWhere = { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }

export async function getUserPermissions(userId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.PERMISSION(orgId, userId))
  cacheLife(CACHE.PERMISSION.life)
  return prisma.permission.findMany({
    where: { userId, orgId, ...activeWhere },
    select: { id: true, action: true, resource: true, resourceId: true, description: true },
  })
}

export async function getFunctionPermissions(functionId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.PERMISSION(orgId, functionId))
  cacheLife(CACHE.PERMISSION.life)
  return prisma.permission.findMany({
    where: { functionId, orgId, ...activeWhere },
    select: { id: true, action: true, resource: true, resourceId: true, description: true },
  })
}

// Permissions effectives = directes (userId) + héritées via les Functions
// assignées. Pas de "use cache" ici : agrège plusieurs lectures déjà
// cachées + un round-trip UserFunction — sert uniquement à la resync
// Supabase déclenchée après mutation, pas un chemin de lecture chaud
// (le chemin chaud, c'est utils.hasPermission sur le cache JWT).
export async function getEffectivePermissionNames(userId: string, orgId: string) {
  const [direct, memberships] = await Promise.all([
    getUserPermissions(userId, orgId),
    prisma.userFunction.findMany({ where: { userId, function: { orgId } }, select: { functionId: true } }),
  ])
  const viaFunctions = await Promise.all(memberships.map((m) => getFunctionPermissions(m.functionId, orgId)))
  return [...direct, ...viaFunctions.flat()].map((p) => permissionName(p.action, p.resource, p.resourceId))
}
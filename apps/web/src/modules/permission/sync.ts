// src/modules/permission/sync.ts
"use server"

import type { Action, Resource } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { createAdminClient } from "@/utils/supabase/server"

import type { Organization, UserMetadata } from "@/types/user"
import { removeUser } from "../user"
import { PermissionName } from "@/services/permission"


/* =========================
   FORMAT DES STRINGS DE PERMISSION (aligné sur PermissionName)
========================= */
function formatPermission(
  action: Action,
  resource: Resource | null,
  resourceId: string | null
): PermissionName {
  if (!resource) return action
  return (resourceId ? `${action}:${resource}:${resourceId}` : `${action}:${resource}`) as PermissionName
}

/* =========================
   PERMISSIONS EFFECTIVES (user direct + functions de l'user dans l'org)
========================= */
async function computeEffectivePermissions(userId: string, orgId: string): Promise<PermissionName[]> {
  const userFunctions = await prisma.userFunction.findMany({
    where: { userId, function: { orgId } },
    select: { functionId: true },
  })
  const functionIds = userFunctions.map((uf) => uf.functionId)

  const permissions = await prisma.permission.findMany({
    where: {
      orgId,
      isActive: true,
      OR: [
        { userId },
        ...(functionIds.length ? [{ functionId: { in: functionIds } }] : []),
      ],
    },
    select: { action: true, resource: true, resourceId: true },
  })

  return Array.from(
    new Set(permissions.map((p) => formatPermission(p.action, p.resource, p.resourceId)))
  )
}

/* =========================
   SYNC D'UN SEUL USER
========================= */
export async function syncUserPermissionsMetadata(userId: string, orgId: string) {
  const supabase = await createAdminClient()

  const { data: { user }, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !user) {
    console.error("[syncUserPermissionsMetadata] user introuvable", userId, error?.message)
    return
  }

  const metadata = (user.user_metadata ?? {}) as UserMetadata
  const organizations = metadata.organizations ?? []

  const targetIndex = organizations.findIndex((org) => org.id === orgId)
  if (targetIndex === -1) {
    // pas la responsabilité de ce service de créer l'org dans les metadata —
        
    return
  }

  const permissions = await computeEffectivePermissions(userId, orgId)

  const updatedOrganizations: Organization[] = organizations.map((org, i) =>
    i === targetIndex ? { ...org, permissions } : org
  )

  const patch: Partial<UserMetadata> = { organizations: updatedOrganizations }

  // garder `organization` (org courante) synchronisée si c'est celle qu'on vient de modifier
  if (metadata.organization?.id === orgId) {
    patch.organization = { ...metadata.organization, permissions }
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { ...metadata, ...patch },
  })

  if (updateError) {
    console.error("[syncUserPermissionsMetadata]", userId, updateError.message)
    return
  }

  // invalide le cache LRU local : prochain getUserInfo() re-fetch depuis Supabase
  removeUser(userId)
}

/* =========================
   POINT D'ENTRÉE — appelé depuis les actions (grant/revoke)
========================= */
export async function syncPermissionsMetadataFor({
  orgId,
  userId,
  functionId,
}: {
  orgId: string
  userId?: string | null
  functionId?: string | null
}) {
  if (userId) {
    await syncUserPermissionsMetadata(userId, orgId)
    return
  }

  if (functionId) {
    const members = await prisma.userFunction.findMany({
      where: { functionId },
      select: { userId: true },
    })
    await Promise.all(members.map((m) => syncUserPermissionsMetadata(m.userId, orgId)))
  }
}
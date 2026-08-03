"use server"

import { Role } from "@/generated/prisma/client"

import { ERRORS } from "@/config"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import type { UserMetadata } from "@/types/user"
import { getRoleProfileKey } from "@/modules/user"
import { syncUserOrganizationProfile } from "@/modules/user"
import { createRoleSpecificEntity } from "@/modules/auth/members/utils"

/** Id du profil de rôle existant pour (userId, orgId), ou null. Idempotence. */
async function findRoleProfileId(role: Role, userId: string, orgId: string): Promise<string | null> {
  switch (role) {
    case "TEACHER":
      return (await prisma.teacher.findFirst({ where: { userId, orgId }, select: { id: true } }))?.id ?? null
    case "STUDENT":
      return (await prisma.student.findFirst({ where: { userId, orgId }, select: { id: true } }))?.id ?? null
    case "PARENT":
      return (await prisma.parent.findFirst({ where: { userId, orgId }, select: { id: true } }))?.id ?? null
    case "DIRECTION":
      return (await prisma.direction.findFirst({ where: { userId, orgId }, select: { id: true } }))?.id ?? null
    default:
      return null
  }
}

/**
 * Crée (si absent) le profil de rôle pour l'org courante et réinjecte son id
 * dans les metadata (directionId/teacherId/…). Idempotent. Sans org ou rôle
 * sans profil (ADMIN/GUEST) : no-op. Indispensable pour sortir de la redirection
 * `!profileId → /auth/user-info` (cf. auth/callback).
 */
async function ensureRoleProfile(userMetadata: UserMetadata, userId: string) {
  const role = userMetadata.role as Role | undefined
  const orgId = userMetadata.organization?.id
  if (!role || !orgId || !getRoleProfileKey(role)) return

  const profileId =
    (await findRoleProfileId(role, userId, orgId)) ??
    (await createRoleSpecificEntity(prisma, userId, role, orgId))?.id

  await syncUserOrganizationProfile({ orgId, role, profileId, status: "ACTIVE" })
}

export async function upsertUserProfile(params: {
  firstName: string
  lastName: string
  sex: "MALE" | "FEMALE"
  dateOfBirth: string
  phone?: string
}) {
  const { firstName, lastName, sex, dateOfBirth, phone } = params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error(ERRORS.AUTH.UNAUTHORIZED)
  }

  const userId = user.id
  const email = user.email!

  // Mise à jour des métadonnées Supabase
  const { error: userError } = await supabase.auth.updateUser({
    data: {
      name: `${firstName} ${lastName}`,
      phone,
    },
  })

  if (userError) {
    console.error("Erreur lors de la mise à jour des métadonnées Supabase:", userError)
  }

  const userDate = new Date(dateOfBirth)
  // Upsert Utilisateur dans Prisma
  const profile = await prisma.user.upsert({
    where: { id: userId },
    update: {
      firstName,
      lastName,
      sex,
      dateOfBirth: userDate,
      phone,
    },
    create: {
      id: userId,
      email,
      firstName,
      lastName,
      sex,
      dateOfBirth: userDate,
      phone,
    },
  })

  // Crée le profil de rôle + injecte le profileId dans les metadata (sinon le
  // callback renvoie indéfiniment vers /auth/user-info).
  await ensureRoleProfile((user.user_metadata ?? {}) as UserMetadata, userId)

  return profile
}


export async function checkUserProfile(userId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error(ERRORS.AUTH.UNAUTHORIZED)
  }
  
  const profile = await prisma.user.findUnique({
    where: { id: userId || user.id },
    select: { id: true }
  })

  return !!profile
}
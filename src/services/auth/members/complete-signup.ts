'use server'
// src/services/auth/members/complete-signup.ts
// Transaction de finalisation d'inscription via lien d'invitation.
// Séquence : validate invitation → create User + UserOrganization + RoleEntity
//            → assign Functions → (PARENT) create ParentRelation
//            → mark invitation used → sync metadata Supabase → audit (async)
import { prisma } from '@/lib/db'
import type { Role } from '@/generated/prisma'
import { getUserInfo } from '@/services/user/userInfo'
import { syncUserOrganizationProfile } from '@/services/user/update'
import { logAuditAsync } from '@/services/audit'
import {
  createRoleSpecificEntity,
  assignFunctionToUser,
  assignMultipleFunctionsToUser,
} from './utils'

// ── Types invitation ──────────────────────────────────────────────────────────
// ⚠ À ALIGNER PAR PROJET — structure du champ `details` JSON de Invitation.
interface InvitationDetails {
  role?: string
  name?: string
  function?: string
  additionalFunctions?: string[]
  organization?: { departmentId?: string }
  invited_by?: { id: string; name: string; email: string }
  parentLink?: { studentId: string; relation: string }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchAndValidateInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: { id: true, email: true, details: true, orgId: true, usedAt: true, expiresAt: true },
  })

  if (!invitation) throw new Error('Invitation non trouvée')
  if (invitation.usedAt) throw new Error('Cette invitation a déjà été utilisée')
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    throw new Error('Cette invitation a expiré')
  }

  return invitation
}

function extractContext(invitation: Awaited<ReturnType<typeof fetchAndValidateInvitation>>) {
  const details = invitation.details as InvitationDetails
  return {
    details,
    orgId: invitation.orgId,
    role: (details.role ?? 'STUDENT') as Role,
    firstName: details.name?.split(' ')[0] || invitation.email.split('@')[0],
    lastName: details.name?.split(' ').slice(1).join(' ') || '',
    departmentId: details.organization?.departmentId,
  }
}

// ── Action principale ─────────────────────────────────────────────────────────

export async function completeSignup(): Promise<
  { data: { userId: string; profileId: string | undefined } } | { error: string }
> {
  try {
    const user = await getUserInfo()
    if (!user?.id) throw new Error('Utilisateur non authentifié')
    if (!user.invitationToken) throw new Error("Token d'invitation non trouvé")

    const userId = user.id
    const invitation = await fetchAndValidateInvitation(user.invitationToken)
    const { details, orgId, role, firstName, lastName, departmentId } = extractContext(invitation)

    const { profileId, createdUserId } = await prisma.$transaction(async (tx) => {
      // 1. Créer/retrouver l'utilisateur
      const createdUser = await tx.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: invitation.email,
          firstName,
          lastName,
          status: 'ACTIVE',
        },
        update: {},
      })

      // 2. Rattacher à l'organisation
      await tx.userOrganization.create({
        data: {
          userId: createdUser.id,
          orgId,
          role,
          isMainOrg: false,
          isResponsable: false,
        },
      })

      // 3. Entité profil selon le rôle
      const profile = await createRoleSpecificEntity(tx, createdUser.id, role, orgId, departmentId)

      // 4. Fonctions
      await assignFunctionToUser(tx, createdUser.id, orgId, details.function, details.invited_by?.id)

      if (role === 'DIRECTION' && Array.isArray(details.additionalFunctions) && details.additionalFunctions.length > 0) {
        await assignMultipleFunctionsToUser(tx, createdUser.id, orgId, details.additionalFunctions, details.invited_by?.id)
      }

      // 5. Lien parent→étudiant (rôle PARENT externe)
      if (role === 'PARENT' && details.parentLink?.studentId && profile?.id) {
        await tx.parentRelation.create({
          data: {
            parentId: profile.id,
            studentId: details.parentLink.studentId,
            relation: details.parentLink.relation || 'Parent',
            orgId,
          },
        })
      }

      // 6. Marquer l'invitation utilisée
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date(), userId: createdUser.id },
      })

      return { profileId: profile?.id, createdUserId: createdUser.id }
    })

    await syncUserOrganizationProfile({ orgId, role, profileId, status: 'ACTIVE' })

    logAuditAsync({
      userId: createdUserId,
      action: 'CREATE',
      resource: 'USER',
      resourceId: invitation.id,
      orgId,
      details: {
        role,
        function: details.function,
        invitationId: invitation.id,
        invited_by: details.invited_by,
      },
    })

    return { data: { userId: createdUserId, profileId } }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Erreur inconnue' }
  }
}

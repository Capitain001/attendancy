'use server'
import { prisma } from '@/lib/prisma'
import type { Role } from '@/generated/prisma'
import { getUserInfo } from '@/services/user/userInfo'
import { syncUserOrganizationProfile } from '@/services/user/update'
import { logAuditAsync } from '@/services/audit'
import {
  createRoleSpecificEntity,
  assignFunctionToUser,
  assignMultipleFunctionsToUser,
} from './utils'

// ── Types ─────────────────────────────────────────────────────────────────────

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

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
type InvitationRecord = Awaited<ReturnType<typeof fetchAndValidateInvitation>>

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

function extractInvitationContext(invitation: InvitationRecord) {
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

async function createUserInOrganization(
  tx: TransactionClient,
  params: {
    userId: string
    email: string
    firstName: string
    lastName: string
    orgId: string
    role: Role
    departmentId?: string
  }
) {
  const createdUser = await tx.user.upsert({
    where: { id: params.userId },
    create: {
      id: params.userId,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      status: 'ACTIVE',
    },
    update: {},
  })

  await tx.userOrganization.create({
    data: {
      userId: createdUser.id,
      orgId: params.orgId,
      role: params.role,
      isMainOrg: false,
      isResponsable: false,
    },
  })

  const profile = await createRoleSpecificEntity(
    tx,
    createdUser.id,
    params.role,
    params.orgId,
    params.departmentId
  )

  return { createdUser, profile }
}

async function assignUserFunctions(
  tx: TransactionClient,
  params: { userId: string; orgId: string; details: InvitationDetails }
) {
  await assignFunctionToUser(tx, params.userId, params.orgId, params.details.function, params.details.invited_by?.id)

  if (
    params.details.role === 'DIRECTION' &&
    Array.isArray(params.details.additionalFunctions) &&
    params.details.additionalFunctions.length > 0
  ) {
    await assignMultipleFunctionsToUser(
      tx,
      params.userId,
      params.orgId,
      params.details.additionalFunctions,
      params.details.invited_by?.id
    )
  }
}

function logSignupAudit(params: {
  userId: string
  invitationId: string
  orgId: string
  details: InvitationDetails
  departmentId?: string
}) {
  logAuditAsync({
    userId: params.userId,
    action: 'CREATE',
    resource: 'USER',
    resourceId: params.invitationId,
    orgId: params.orgId,
    details: {
      role: params.details.role,
      function: params.details.function,
      departmentId: params.departmentId,
      invited_by: params.details.invited_by,
      invitationId: params.invitationId,
      action_type: 'ACCEPT_INVITATION',
    },
  })
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
    const { details, orgId, role, firstName, lastName, departmentId } = extractInvitationContext(invitation)

    const { profileId, createdUserId } = await prisma.$transaction(async (tx) => {
      const { createdUser, profile } = await createUserInOrganization(tx, {
        userId,
        email: invitation.email,
        firstName,
        lastName,
        orgId,
        role,
        departmentId,
      })

      await assignUserFunctions(tx, { userId: createdUser.id, orgId, details })

      // Lien parent→étudiant (rôle PARENT externe)
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

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date(), userId: createdUser.id },
      })

      return { profileId: profile?.id, createdUserId: createdUser.id }
    })

    await syncUserOrganizationProfile({ orgId, role, profileId, status: 'ACTIVE' })

    logSignupAudit({ userId: createdUserId, invitationId: invitation.id, orgId, details, departmentId })

    return { data: { userId: createdUserId, profileId } }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Erreur inconnue' }
  }
}

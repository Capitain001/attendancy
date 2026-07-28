// src/services/invite/actions/invite.mutations.ts
'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { setUserInfo } from '@/services/user/update'
import { createAdminClient } from '@/utils/supabase/server'
import { ERRORS } from '@/config'
import { INVITE_URL } from '@/config/url'
import { ROLE_PATHS } from '@/config/roles'
import { sendInviteSchema, acceptInviteSchema } from '../validation'
import type { SendInviteInput, AcceptInviteInput } from '../validation'
import { createInvitation, completeInvite, getInviteByToken, resendInvite, deleteInvitation } from '../database'
import type { Role } from '@/generated/prisma'
import type { Organization, Role as UserRole } from '@/services/user/types'
import type { InviteDetails } from '../types'

export async function sendInviteAction(input: SendInviteInput) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

  if (user.role !== 'DIRECTION') return { error: ERRORS.AUTH.FORBIDDEN }

  const parsed = v.parse(sendInviteSchema, input)

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  let invitation
  try {
    invitation = await createInvitation(token, {
      email: parsed.email,
      orgId,
      role: parsed.role as Role,
      expiresAt,
    })
  } catch (e) {
    const isUnique = e instanceof Error && (e.message.includes('Unique constraint') || e.message.includes('P2002'))
    return {
      error: isUnique
        ? 'Une invitation pour cet email est déjà en cours'
        : "Erreur lors de la création de l'invitation",
    }
  }

  const admin = await createAdminClient()
  const redirectTo = `${INVITE_URL}?token=${token}`
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.email, { redirectTo })

  if (inviteError) return { error: `Email non envoyé : ${inviteError.message}` }

  return { data: { invitationId: invitation.id } }
}

// Exception RULE-USR-001 documentée : l'invité n'a pas encore d'org dans son token.
// L'email match entre user.email et invitation.email garantit l'ownership.
export async function acceptInviteAction(input: AcceptInviteInput) {
  const user = await getUserInfo()
  if (!user?.id || !user.email) return { error: ERRORS.AUTH.UNAUTHORIZED }

  const parsed = v.parse(acceptInviteSchema, input)

  const invitation = await getInviteByToken(parsed.token)
  if (!invitation) return { error: 'Invitation introuvable ou expirée' }
  if (invitation.usedAt) return { error: 'Cette invitation a déjà été utilisée' }
  if (invitation.expiresAt && invitation.expiresAt < new Date()) return { error: 'Cette invitation a expiré' }
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return { error: 'Cette invitation ne correspond pas à votre email' }
  }

  const details = invitation.details as InviteDetails
  const role = details.role as Role

  const { profileId } = await completeInvite({
    userId: user.id,
    email: user.email,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    invitationId: invitation.id,
    orgId: invitation.orgId,
    role,
  })

  const roleKey = roleToProfileKey(role)
  const orgSnapshot: Organization = {
    id: invitation.organization.id,
    name: invitation.organization.name ?? undefined,
    slug: invitation.organization.slug ?? '',
    responsable: false,
    ...(roleKey && profileId ? { [roleKey]: profileId } : {}),
  }

  await setUserInfo({ role, status: 'ACTIVE', organization: orgSnapshot, organizations: [orgSnapshot] })

  const slug = invitation.organization.slug ?? ''

  return { data: { redirectPath: `/${slug}/${ROLE_PATHS[role as UserRole] ?? ''}` } }
}

export type InvitationActionResult =
  | { success: true; message?: string; link?: string }
  | { success: false; error: string }

export async function resendInvitationAction(invitation: { id: string; email: string }): Promise<InvitationActionResult> {
  const user = await getUserInfo()
  if (!user?.id) return { success: false, error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { success: false, error: ERRORS.ORG.NOT_FOUND }
  try {
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await resendInvite(invitation.id, newExpiry)
    const admin = await createAdminClient()
    await admin.auth.admin.inviteUserByEmail(invitation.email)
    return { success: true, message: 'Invitation renvoyée' }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function generateMagicLinkAction(invitation: { id: string; email: string }): Promise<InvitationActionResult> {
  const user = await getUserInfo()
  if (!user?.id) return { success: false, error: ERRORS.AUTH.UNAUTHORIZED }
  try {
    const admin = await createAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({ type: 'invite', email: invitation.email })
    if (error) return { success: false, error: error.message }
    return { success: true, link: data.properties.action_link }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteInvitationUserAction(invitation: { id: string }): Promise<InvitationActionResult> {
  const user = await getUserInfo()
  if (!user?.id) return { success: false, error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { success: false, error: ERRORS.ORG.NOT_FOUND }
  try {
    await deleteInvitation(invitation.id)
    return { success: true, message: 'Invitation supprimée' }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

function roleToProfileKey(role: Role): keyof Organization | null {
  const map: Partial<Record<Role, keyof Organization>> = {
    TEACHER: 'teacherId',
    STUDENT: 'studentId',
    PARENT: 'parentId',
  }
  return map[role] ?? null
}

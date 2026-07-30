'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { createInvitation } from '../database'
import { generateInviteToken, sendSupabaseInviteEmail } from '../core'
import { notifyInvitationStakeholders } from '../notifications'
import { checkInvitationResources, getClassInvitations } from './database'
import { inviteStudentSchema } from './validation'
import type { Role } from '@/generated/prisma'

export async function inviteStudentAction(input: v.InferInput<typeof inviteStudentSchema>) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.safeParse(inviteStudentSchema, input)
    if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Paramètres invalides' }

    const { email, firstName, lastName, classId, groupIds, parentEmail, expiresInDays } = parsed.output

    const check = await checkInvitationResources({ classId, orgId, groupIds })
    if (!check.valid) return { error: check.error }

    const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || undefined
    const { token, expiresAt } = generateInviteToken(expiresInDays)
    const invitedBy = { id: user.id, name: user.name ?? '', email: user.email ?? '' }

    let invitation
    try {
      invitation = await createInvitation(token, {
        email,
        orgId,
        role: 'STUDENT' as Role,
        expiresAt,
        resourceId: classId,
        resourceType: 'CLASS',
        details: {
          name,
          enrollment: {
            classId,
            ...(groupIds?.length ? { groupIds } : {}),
            ...(parentEmail ? { parentEmail } : {}),
          },
          invited_by: invitedBy,
        },
      })
    } catch (e) {
      const isUnique = e instanceof Error && (e.message.includes('Unique constraint') || e.message.includes('P2002'))
      return { error: isUnique ? 'Une invitation pour cet email est déjà en cours' : "Erreur lors de la création de l'invitation" }
    }

    const inviteError = await sendSupabaseInviteEmail(email, token)
    if (inviteError) return { error: `Email non envoyé : ${inviteError}` }

    void notifyInvitationStakeholders({
      invitationId: invitation.id,
      orgId,
      actorId: user.id,
      event: 'CREATED',
      invitedEmail: email,
      classId,
    })

    return { data: { invitationId: invitation.id } }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function getClassInvitesAction(params: { classId: string }) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const data = await getClassInvitations(params.classId, orgId)
    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

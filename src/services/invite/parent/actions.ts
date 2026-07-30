'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { prisma } from '@/lib/prisma'
import { createInvitation } from '../database'
import { generateInviteToken, sendSupabaseInviteEmail } from '../core'
import { inviteParentSchema } from './validation'
import type { Role } from '@/generated/prisma'

export async function inviteParentAction(input: v.InferInput<typeof inviteParentSchema>) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.safeParse(inviteParentSchema, input)
    if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Paramètres invalides' }

    const { email, firstName, lastName, studentId, relation, expiresInDays } = parsed.output

    // RULE-USR-001 : vérifier que l'étudiant appartient à cette organisation
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        deletedAt: null,
        user: { deletedAt: null, userOrganizations: { some: { orgId, role: 'STUDENT' } } },
      },
      select: { id: true },
    })
    if (!student) return { error: 'Étudiant introuvable dans cette organisation' }

    const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || undefined
    const { token, expiresAt } = generateInviteToken(expiresInDays)
    const invitedBy = { id: user.id, name: user.name ?? '', email: user.email ?? '' }

    let invitation
    try {
      invitation = await createInvitation(token, {
        email,
        orgId,
        role: 'PARENT' as Role,
        expiresAt,
        resourceId: studentId,
        resourceType: 'STUDENT',
        details: {
          name,
          parentLink: { studentId, relation },
          invited_by: invitedBy,
        },
      })
    } catch (e) {
      const isUnique = e instanceof Error && (e.message.includes('Unique constraint') || e.message.includes('P2002'))
      return { error: isUnique ? 'Une invitation pour cet email est déjà en cours' : "Erreur lors de la création de l'invitation" }
    }

    const inviteError = await sendSupabaseInviteEmail(email, token)
    if (inviteError) return { error: `Email non envoyé : ${inviteError}` }

    return { data: { invitationId: invitation.id } }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

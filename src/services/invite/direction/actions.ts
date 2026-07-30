'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { createInvitation } from '../database'
import { generateInviteToken, sendSupabaseInviteEmail } from '../core'
import { checkFunctionsExist } from './database'
import { inviteDirectionSchema } from './validation'
import type { Role } from '@/generated/prisma'

export async function inviteDirectionAction(input: v.InferInput<typeof inviteDirectionSchema>) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.safeParse(inviteDirectionSchema, input)
    if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Paramètres invalides' }

    const { email, name, functions, expiresInDays } = parsed.output

    const { valid, invalid } = await checkFunctionsExist(functions, orgId)
    if (invalid.length > 0) return { error: `Fonctions inconnues dans cette organisation : ${invalid.join(', ')}` }
    if (valid.length === 0) return { error: 'Aucune fonction valide trouvée' }

    const { token, expiresAt } = generateInviteToken(expiresInDays)
    const invitedBy = { id: user.id, name: user.name ?? '', email: user.email ?? '' }

    let invitation
    try {
      invitation = await createInvitation(token, {
        email,
        orgId,
        role: 'DIRECTION' as Role,
        expiresAt,
        details: {
          name,
          function: valid[0],
          additionalFunctions: valid.slice(1),
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

import { prisma } from '@/lib/db'
import { buildSessionUrl } from '@/config/url'

const TOKEN_DURATION_MINUTES = 15

type CreateTokenResult = {
  token: string
  expiresAt: Date
}

type ValidateTokenResult = {
  sessionId: string
  scheduleId: string
  isExpired: boolean
}

export async function createSessionToken(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  })
  if (!session) throw new Error('Session introuvable.')
  if (session.status !== 'ACTIVE') throw new Error("La session n'est pas active.")

  const [result] = await prisma.$queryRaw<CreateTokenResult[]>`
    SELECT token::text, "expiresAt"
    FROM create_session_token(${sessionId}::uuid, ${TOKEN_DURATION_MINUTES}::int)
  `
  return {
    token: result.token,
    expiresAt: result.expiresAt,
    url: buildSessionUrl(result.token),
  }
}

export async function validateSessionToken(token: string) {
  const [result] = await prisma.$queryRaw<ValidateTokenResult[]>`
    SELECT "sessionId"::text, "scheduleId"::text, "isExpired"
    FROM validate_session_token(${token}::uuid)
  `
  if (!result) throw new Error('Token invalide.')
  if (result.isExpired) throw new Error('Ce QR code a expiré. Demandez au professeur d\'en générer un nouveau.')
  return { sessionId: result.sessionId, scheduleId: result.scheduleId }
}

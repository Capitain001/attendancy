import { prisma } from '@/lib/prisma'
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




// ─── recordStudentAttendance ──────────────────────────────────────────────────

/**
 * Enregistre la présence d'un étudiant après validation du token.
 * Status initial : PENDING (en attente de confirmation du prof).
 * Idempotent : si déjà enregistré, retourne l'entrée existante.
 */
export async function recordStudentAttendance(
  scheduleId: string,
  studentId: string,
  orgId:string,
  coords?: { lat: number; lng: number },
) {
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: {
      studentId,
      class: { schedules: { some: { id: scheduleId } } },
    },
    select: { id: true },
  });

  if (!enrollment) throw new Error("Enrollment introuvable.");

  const existing = await prisma.attendance.findUnique({
    where: { scheduleId_studentId: { scheduleId, studentId } },
    select: { id: true, status: true },
  });

  if (existing) return { id: existing.id, status: existing.status, alreadyRecorded: true };

   const attendance =prisma.attendance.create({
    data: {
      scheduleId,
      studentId,
      enrollmentId: enrollment.id,
      status: "PENDING",
      orgId
    },
    select: { id: true, status: true  },
  });
  return {...attendance , alreadyRecorded:false}
}

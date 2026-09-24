'use server'
import { ERRORS } from '@/config'
import { authAccess } from '@/services/auth'
import { createSessionToken, recordStudentAttendance, validateSessionToken } from '../database/token.mutations'
import { getCurrentStudentId } from '@/services/student'

export async function generateTokenAction(sessionId: string) {
  const auth = await authAccess({ requiredRole: ['TEACHER', 'DIRECTION'] })
  if (!auth.data) return { error: auth.error }

  try {
    return { data: await createSessionToken(sessionId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}


// ─── attendAction ─────────────────────────────────────────────────────────────

/**
 * Appelée depuis la page /attend?token=xxx après connexion étudiant.
 * Valide le token et enregistre la présence (PENDING).
 */

export async function attendAction(
  token: string,
  coords?: { lat: number; lng: number }
) {

  // Seuls les étudiants peuvent s'enregistrer via token
  const auth = await authAccess({ requiredRole: ['STUDENT'] })
  if (!auth.data) return { error: auth.error }

  const { user, orgId } = auth.data
  try {

    // ✅ remplacement ici
    const studentId = await getCurrentStudentId()
    if (!studentId) throw new Error("Profil étudiant introuvable.");

    // Valide le token
    const { scheduleId } = await validateSessionToken(token);

    // Enregistre la présence
    const data = await recordStudentAttendance(scheduleId, studentId,orgId, coords);

    return { data };
  } catch (error) {
    console.error("[attendAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

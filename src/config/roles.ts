// src/config/roles.ts
// Constantes de rôles partagées à travers l'application :
// - Segments d'URL par rôle (routing)
// - Labels French par rôle (UI)
// - validateInvitation : logique pure d'acceptation d'une invitation
import type { Role } from '@/services/user/types'
import type { GetInviteByTokenDto } from '@/services/invite/types'

// Segment d'URL par rôle — /<slug>/<segment>
// Source de vérité : importer depuis ici, pas redéfinir localement.
export const ROLE_PATHS: Record<Role, string> = {
  ADMIN:       'admin',
  DIRECTION:   'direction',
  TEACHER:     'teacher',
  STUDENT:     'student',
PARENT:      'parent',
  GUEST:      'inviter',
}

// Labels UI en français — pour affichage dans l'UI (invitations, profil…).
export const ROLE_LABELS: Record<string, string> = {
  // SUPER_ADMIN: 'Super Admin',
  ADMIN:       'Administrateur',
  DIRECTION:   'Direction',
  TEACHER:     'Enseignant',
  STUDENT:     'Étudiant',
  PARENT:      'Parent',
  // MEMBER:      'Membre',
}

/** Segment d'URL pour un rôle donné. Retourne '' si le rôle est inconnu. */
export function roleToPath(role?: string | null): string {
  return ROLE_PATHS[role as Role] ?? ''
}

/** Label UI pour un rôle donné. Retourne le rôle brut si non mappé. */
export function roleToLabel(role?: string | null): string {
  return ROLE_LABELS[role ?? ''] ?? role ?? 'Membre'
}

// ── validateInvitation ────────────────────────────────────────────────────────

type Invitation = NonNullable<GetInviteByTokenDto>

type ValidateInvitationResult =
  | { ok: true;  invitation: Invitation; roleLabel: string }
  | { ok: false; reason: 'invalid' | 'mismatch' }

/**
 * Valide une invitation récupérée via getInviteByTokenAction.
 * Vérifie : existence, non-utilisée, non-expirée, email correspondant.
 * Retourne l'invitation + le label de rôle si valide, sinon la raison d'échec.
 * Fonction pure — aucun I/O, aucun redirect. L'appelant décide de la suite.
 */
export function validateInvitation(
  inviteRes: { data: GetInviteByTokenDto } | { error: string } | null | undefined,
  userEmail: string,
): ValidateInvitationResult {
  const invitation = inviteRes && 'data' in inviteRes ? inviteRes.data : null

  if (
    !invitation ||
    invitation.usedAt ||
    (invitation.expiresAt && invitation.expiresAt < new Date())
  ) {
    return { ok: false, reason: 'invalid' }
  }

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    return { ok: false, reason: 'mismatch' }
  }

  const details   = invitation.details as { role?: string }
  const roleLabel = roleToLabel(details.role)

  return { ok: true, invitation, roleLabel }
}

'use client'

import { useMemo } from 'react'

// ── 1. Hook d'invitations de la classe ──────────────────────────────────────────
// - invitations        : liste des invitations émises pour cette classe (avec email, status, usedAt, expiresAt, etc.).
// - isLoadingInvitations: statut de chargement initial.
// - inviteStudentsBulk : mutation d'envoi en masse consommée par le modal (inviteStudentsBulk.mutateAsync).
// - resend             : relance d'une invitation en attente (resend.mutate(invitation)).
// - revoke             : annulation d'une invitation en attente (revoke.mutate(invitation)).
import { useClassInvitations } from '@/hooks/data/invitation/use-class-invitations'

// ── 2. Hook des étudiants disponibles ──────────────────────────────────────────
// - available          : liste des étudiants de l'établissement non encore inscrits dans cette classe.
//   Ce vivier alimente directement la sélection de l'Étape 1 du futur modal.
import { useAvailableStudents } from '@/hooks/data/student-enrollments/useAvailableStudents'

// ── 3. Hook des inscriptions confirmées ─────────────────────────────────────────
// - enrollments        : inscriptions actives (StudentEnrollment) de la classe.
import { useClassEnrollments } from '@/hooks/data/student-enrollments'

interface TClassesInvitationScreenProps {
  classId: string
  classLabel: string
}

export function TClassesInvitationScreen({ classId, classLabel }: TClassesInvitationScreenProps) {
  // ── HOOK 1 : Invitations & actions associées ─────────────────────────────────
  const {
    invitations,
    isLoading: isLoadingInvitations,
    inviteStudentsBulk,
    resend,
    revoke,
  } = useClassInvitations(classId)

  // ── HOOK 2 : Étudiants inscrits dans la classe ───────────────────────────────
  const {
    enrollments,
    isLoading: isLoadingEnrollments,
  } = useClassEnrollments(classId)

  // ── HOOK 3 : Étudiants disponibles dans l'école (hors classe) ────────────────
  const {
    available,
    isLoading: isLoadingAvailable,
  } = useAvailableStudents(classId)

  // ── FILTRES & ÉTATS DÉRIVÉS ───────────────────────────────────────────────────

  // Liste des étudiants actuellement inscrits (format Student pour l'affichage)
  const participants = useMemo(
    () => enrollments.map((e) => e.student),
    [enrollments],
  )

  // Invitations en cours : statut PENDING et non expirées
  const pendingInvitations = useMemo(
    () => invitations.filter(isInvitationPending),
    [invitations],
  )

  // Invitations acceptées (historique d'intégration)
  const acceptedInvitations = useMemo(
    () => invitations.filter((inv) => inv.status === "ACCEPTED"),
    [invitations],
  )

  // État global de chargement
  const isLoading = isLoadingInvitations || isLoadingEnrollments || isLoadingAvailable

  return (
    <div className="space-y-8 p-6">
      {/* ── ZONE 1 : En-tête de classe (classLabel, compteurs effectifs & invitations) */}
      <header>
        {/* Titre et métriques dérivées : participants.length, pendingInvitations.length */}
      </header>

      {/* ── ZONE 2 : Membres actifs & Trigger du modal plein écran */}
      <section>
        {/*
          Emplacement du futur TeacherClassInviteModal :
          Props qui lui seront passées :
            - classId={classId}
            - classLabel={classLabel}
            - availableStudents={available}
            - trigger={<button>...</button>}
          Le modal exploitera directement la mutation `inviteStudentsBulk`
        */}

        {/* Affichage des participants existants (participants) */}
      </section>

      {/* ── ZONE 3 : Suivi des invitations en attente */}
      <section>
        {/*
          Affichage des invitations en cours (pendingInvitations) :
          - email, expiresAt
          - actions unitaires : resend.mutate(inv), revoke.mutate(inv)
        */}
      </section>

      {/* ── ZONE 4 : Inscription directe alternative (sans invitation) */}
      <section>
        {/* Inscription directe d'étudiants de l'école (ex: EnrollStudentsModal) */}
      </section>
    </div>
  )
}
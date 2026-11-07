'use client'

/**
 * apps/web/src/components/users/list/TClassesInvitationScreen.tsx
 *
 * Écran parent de gestion des participants & invitations d'une classe (Espace Enseignant / Direction).
 *
 * Rôles :
 * 1. Présenter l'état actuel de la classe (étudiants déjà inscrits et confirmés).
 * 2. Déclencher le modal plein écran `TeacherClassInviteModal` pour inviter des étudiants en masse.
 * 3. Suivre les invitations en attente (inbox / email) avec relance ou annulation.
 */

import { useMemo } from 'react'
import { UserPlus, Mail, Clock, RotateCw, XCircle, Users } from 'lucide-react'

import { useClassInvitations } from '@/hooks/data/invitation/use-class-invitations'
import { useAvailableStudents } from '@/hooks/data/student-enrollments/useAvailableStudents'
import { useClassEnrollments } from '@/hooks/data/student-enrollments'
import type { InvitationListItem } from '@/modules/invitation'
import { isInvitationPending } from '@/components/personal/teacher/utils'
import { TeacherClassInviteModal } from '@/components/personal/teacher/class/invitation/TeacherClassInviteModal'
import { ParticipantList } from './ParticipantList'

interface TClassesInvitationScreenProps {
  classId: string
  classLabel: string
}

export function TClassesInvitationScreen({ classId, classLabel }: TClassesInvitationScreenProps) {
  // ── 1. Données d'invitations ─────────────────────────────────────────────────
  const {
    invitations,
    isLoading: isLoadingInvitations,
    resend,
    revoke,
  } = useClassInvitations(classId)

  // ── 2. Étudiants inscrits dans la classe ─────────────────────────────────────
  const {
    enrollments,
    isLoading: isLoadingEnrollments,
  } = useClassEnrollments(classId)

  // ── 3. Étudiants disponibles dans l'école (vivier pour l'invitation) ─────────
  const {
    available,
    isLoading: isLoadingAvailable,
  } = useAvailableStudents(classId)

  // ── Filtres & Dérivations ────────────────────────────────────────────────────
  const participants = useMemo(
    () => enrollments.map((e) => e.student),
    [enrollments],
  )

  const pendingInvitations = useMemo(
    () => invitations.filter((invitation) => isInvitationPending(invitation)),
    [invitations],
  )

  const isLoading = isLoadingInvitations || isLoadingEnrollments || isLoadingAvailable

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* ── EN-TÊTE DE LA CLASSE ─────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="size-4" />
            <span>Promotion &middot; Participants</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{classLabel}</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {participants.length} étudiant{participants.length > 1 ? 's' : ''} inscrit{participants.length > 1 ? 's' : ''}
            {pendingInvitations.length > 0 && ` &middot; ${pendingInvitations.length} invitation(s) en attente`}
          </p>
        </div>

        {/* Bouton d'ouverture du modal plein écran */}
        <TeacherClassInviteModal
          classId={classId}
          classLabel={classLabel}
          students={available}
          trigger={
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <UserPlus className="size-4" />
              <span>Inviter des étudiants</span>
            </button>
          }
        />
      </header>

      {/* ── SECTION 1 : ÉTUDIANTS ACTUELLEMENT INSCRITS ──────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Étudiants de la classe ({participants.length})
          </h2>
        </div>

        {participants.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <ParticipantList participants={participants} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            Aucun étudiant n'est encore inscrit dans cette classe.
          </div>
        )}
      </section>

      {/* ── SECTION 2 : SUIVI DES INVITATIONS EN ATTENTE ─────────────────────── */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Invitations en attente ({pendingInvitations.length})
          </h2>
        </div>

        {pendingInvitations.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucune invitation en attente pour cette classe.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {pendingInvitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">{inv.email}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-3" />
                    <span>
                      {inv.expiresAt
                        ? `Expire le ${new Date(inv.expiresAt).toLocaleDateString('fr-FR')}`
                        : 'En attente'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => resend.mutate(inv as unknown as InvitationListItem)}
                    disabled={resend.isPending}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <RotateCw className="size-3" />
                    Relancer
                  </button>

                  <button
                    type="button"
                    onClick={() => revoke.mutate(inv as unknown as InvitationListItem)}
                    disabled={revoke.isPending}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <XCircle className="size-3" />
                    Annuler
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
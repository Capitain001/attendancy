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




// apps/web/src/components/users/list/TClassesInvitationScreen.tsx
"use client";

import { useMemo, useState } from "react";
import { RotateCw, UserMinus, UserPlus, X } from "lucide-react";


import {
  getStudentName,
  isInvitationPending,
} from "@/components/personal/teacher/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassInvitations } from "@/hooks/data/invitation/use-class-invitations";
import {
  useClassEnrollments,
  useRemoveStudentEnrollment,
} from "@/hooks/data/student-enrollments";
import { StudentAvatar } from "@/components/personal/teacher/student/StudentAvatar";
import { ClassEnrollModal } from "@/components/personal/teacher/class/enrollment/ClassEnrollModal";

interface TClassesInvitationScreenProps {
  classId: string;
  classLabel: string;
}

const formatDate = (d: Date | string | null) =>
  d
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(
        new Date(d),
      )
    : "—";

/** Avatar d'une invitation : on ne connaît que l'email. */
const emailUser = (email: string) => ({
  email,
  firstName: null,
  lastName: null,
  avatar_url: null,
});

export function TClassInvitationScreen({ classId, classLabel }: TClassesInvitationScreenProps) {
  const [open, setOpen] = useState(false);

  const {
    invitations,
    isLoading: isLoadingInvitations,
    isError: isInvitationQueryError,
    error: invitationQueryError,
    resend,
    revoke,
  } = useClassInvitations(classId);
  const { enrollments, isLoading: isLoadingEnrollments } = useClassEnrollments(classId);
  const { removeStudentEnrollment, isRemoving } = useRemoveStudentEnrollment(classId);

  const participants = useMemo(
    () => enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      student: enrollment.student,
    })),
    [enrollments],
  );




  // Même critère que le serveur : non utilisée et non expirée (un refus expire l'invitation).
  const pendingInvitations = useMemo(
    () => invitations.filter((inv) => isInvitationPending(inv)),
    [invitations],
  );
  const acceptedInvitations = useMemo(
    () => invitations.filter((inv) => inv.status === "ACCEPTED"),
    [invitations],
  );

  const handleRemoveStudent = (enrollmentId: string) => {
    const confirmed = window.confirm(
      "Retirer cet étudiant de la classe ? Il pourra être réinscrit ultérieurement.",
    );
    if (confirmed) removeStudentEnrollment(enrollmentId);
  };

  return (
    <div className="space-y-8 p-6">
      {/* ── ZONE 1 : en-tête et compteurs */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{classLabel}</h1>

          <p className="text-sm text-muted-foreground">
            {isLoadingEnrollments || isLoadingInvitations
              ? "Chargement…"
              : `${participants.length} inscrit(s) · ${pendingInvitations.length} invitation(s) en attente`}
          </p>

        </div>

        <Button onClick={() => setOpen(true)}>
          <UserPlus className="size-4" />
          Inscrire des étudiants
        </Button>
      </header>

      {isInvitationQueryError && (
        <section
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <p className="font-medium">Impossible de charger les invitations de cette classe.</p>
          {invitationQueryError instanceof Error && (
            <p className="mt-1 text-xs">{invitationQueryError.message}</p>
          )}
        </section>
      )}

      {/* ── ZONE 2 : membres actifs */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Étudiants inscrits</h2>

        {isLoadingEnrollments ? (
          <Skeleton className="h-24 w-full" />
        ) : participants.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucun étudiant inscrit pour le moment.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {participants.map(({ enrollmentId, student }) => (
              <li key={student.id} className="flex items-center gap-3 rounded-lg border p-3">
                <StudentAvatar user={student.user} className="size-9" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{getStudentName(student.user)}</p>
                  <p className="truncate text-xs text-muted-foreground">{student.user.email}</p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  title="Retirer de la classe"
                  aria-label={`Retirer ${getStudentName(student.user)} de la classe`}
                  disabled={isRemoving}
                  onClick={() => handleRemoveStudent(enrollmentId)}
                >
                  <UserMinus className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── ZONE 3 : invitations en attente */}
      {(isLoadingInvitations || pendingInvitations.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">En attente de réponse</h2>

          {isLoadingInvitations ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <ul className="divide-y rounded-lg border">
              {pendingInvitations.map((inv) => (
                <li key={inv.id} className="flex items-center gap-3 p-3">
                  <StudentAvatar user={emailUser(inv.email)} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Envoyée le {formatDate(inv.createdAt)}
                      {inv.expiresAt && ` · expire le ${formatDate(inv.expiresAt)}`}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    title="Relancer"
                    disabled={resend.isPending || revoke.isPending}
                    onClick={() => resend.mutate(inv)}
                  >
                    <RotateCw className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    title="Annuler l'invitation"
                    disabled={resend.isPending || revoke.isPending}
                    onClick={() => revoke.mutate(inv)}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── ZONE 4 : historique des invitations acceptées */}
      {acceptedInvitations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Invitations acceptées</h2>
          <ul className="divide-y rounded-lg border">
            {acceptedInvitations.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 p-3">
                <StudentAvatar user={emailUser(inv.email)} className="size-8" />
                <p className="min-w-0 flex-1 truncate text-sm">{inv.email}</p>
                <Badge variant="secondary">
                  Acceptée le {formatDate(inv.usedAt)}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {open && (
        <ClassEnrollModal
          classId={classId}
          classLabel={classLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
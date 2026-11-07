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
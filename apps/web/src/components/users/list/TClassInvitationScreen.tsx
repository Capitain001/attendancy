"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { UserPlus } from "lucide-react";

import { isInvitationPending } from "@/components/personal/teacher/utils";
import { ClassEnrollModal } from "@/components/personal/teacher/class/enrollment/ClassEnrollModal";
import { useClassInvitations } from "@/hooks/data/invitation/use-class-invitations";
import { useClassEnrollments } from "@/hooks/data/student-enrollments";
import type { InvitationListItem } from "@/modules/invitation";
import { ClassInvitationsSection } from "./ClassInvitationsSection";
import { InvitationDrawer } from "./InvitationDrawer";
import { ParticipantList } from "./ParticipantList";

interface TClassInvitationScreenProps {
  classId: string;
  classLabel: string;
  slug?: string;
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function TClassInvitationScreen({
  classId,
  classLabel,
  slug,
}: TClassInvitationScreenProps) {
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedInvitationId, setSelectedInvitationId] = useState<
    string | null
  >(null);
  const params = useParams<{ slug?: string }>();
  const activeSlug = slug ?? params?.slug;
  const studentsHref = activeSlug
    ? `/personal/${encodeURIComponent(activeSlug)}/teacher/classes/${classId}/students`
    : undefined;
  const now = new Date();

  const {
    invitations,
    isLoading: isLoadingInvitations,
    isFetching: isFetchingInvitations,
    isError: isInvitationQueryError,
    error: invitationQueryError,
    refetch: refetchInvitations,
    resend,
    revoke,
  } = useClassInvitations(classId);
  const { enrollments, isLoading: isLoadingEnrollments } =
    useClassEnrollments(classId);

  const participants = enrollments.map((enrollment) => enrollment.student);
  const pendingCount = invitations.filter((invitation) =>
    isInvitationPending(invitation, now),
  ).length;
  const selectedInvitation =
    invitations.find((invitation) => invitation.id === selectedInvitationId) ??
    null;
  const errorMessage =
    invitationQueryError instanceof Error
      ? invitationQueryError.message
      : "Impossible de charger les invitations.";
  const closeInvitation = () => setSelectedInvitationId(null);

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-lg font-semibold">{classLabel}</h1>
      </header>

      <section className="flex items-start gap-4">
        <button
          type="button"
          title="Inscrire des étudiants"
          aria-label="Inscrire des étudiants"
          onClick={() => setIsEnrollModalOpen(true)}
          className="flex size-14 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <UserPlus className="size-4" />
        </button>
        <ParticipantList
          participants={participants}
          className="min-w-0 flex-1"
        />
        {studentsHref && (
          <Link
            href={studentsHref}
            className="shrink-0 self-center text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Voir plus
          </Link>
        )}
      </section>

      <section className="flex gap-10">
        <Stat
          value={isLoadingEnrollments ? "…" : participants.length}
          label="Inscrits"
        />
        <Stat
          value={isLoadingInvitations ? "…" : pendingCount}
          label="En attente"
        />
      </section>

      <ClassInvitationsSection
        invitations={invitations}
        isLoading={isLoadingInvitations}
        isFetching={isFetchingInvitations}
        isError={isInvitationQueryError}
        errorMessage={errorMessage}
        now={now}
        onRetry={() => void refetchInvitations()}
        onInvitationClick={(invitation) =>
          setSelectedInvitationId(invitation.id)
        }
      />

      <InvitationDrawer
        invitation={selectedInvitation}
        classLabel={classLabel}
        now={now}
        resendPending={resend.isPending}
        revokePending={revoke.isPending}
        onResend={(invitation) => resend.mutate(invitation)}
        onRevoke={(invitation, closeInvitation) =>
          revoke.mutate(invitation, { onSuccess: closeInvitation })
        }
        onClose={closeInvitation}
      />

      {isEnrollModalOpen && (
        <ClassEnrollModal
          classId={classId}
          classLabel={classLabel}
          onClose={() => setIsEnrollModalOpen(false)}
        />
      )}
    </div>
  );
}

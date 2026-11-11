// src/components/users/list/ClassInvitationsSection.tsx
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { InvitationListItem } from "@/modules/invitation";
import { InvitationList } from "./InvitationList";

interface ClassInvitationsSectionProps {
  invitations: InvitationListItem[];
  className?: string;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage: string;
  now: Date;
  onRetry: () => void;
  onInvitationClick: (invitation: InvitationListItem) => void;
}

export function ClassInvitationsSection({
  invitations,
  className,
  isLoading,
  isFetching,
  isError,
  errorMessage,
  now,
  onRetry,
  onInvitationClick,
}: ClassInvitationsSectionProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium">Invitations de la classe</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Chargement des invitations…
        </p>
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
        >
          <p className="text-sm text-destructive">{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isFetching}
          >
            {isFetching && <Loader2 className="size-4 animate-spin" />}
            Réessayer
          </Button>
        </div>
      ) : (
        <InvitationList
          invitations={invitations}
          now={now}
          onInvitationClick={onInvitationClick}
          className={className}
        />
      )}
    </section>
  );
}

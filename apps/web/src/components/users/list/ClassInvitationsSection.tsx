// src/components/users/list/ClassInvitationsSection.tsx
import { ChevronDown, Loader2 } from "lucide-react";

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
  // Rien à gérer → rien à afficher.
  if (!isLoading && !isError && invitations.length === 0) return null;

  return (
    <details className="group border-t pt-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-sm font-medium">
          Invitations en attente
          {!isLoading && !isError && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {invitations.length}
            </span>
          )}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="pt-2">
        {isLoading ? (
          <p className="py-2 text-sm text-muted-foreground">Chargement…</p>
        ) : isError ? (
          <div role="alert" className="flex items-center justify-between gap-3 py-2">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button
              type="button"
              variant="ghost"
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
      </div>
    </details>
  );
}
// src/components/users/list/InvitationList.tsx
import { ChevronRight } from "lucide-react";

import type { InvitationListItem } from "@/modules/invitation";
import { resolveInvitationUiStatus } from "@/modules/invitation/policy";
import {
  getStatusBadgeInfo,
  INVITATION_BADGE_CLASSES,
} from "@/modules/invitation/status";

export function InvitationList({
  invitations,
  now,
  onInvitationClick,
  className,
}: {
  invitations: InvitationListItem[];
  now: Date;
  onInvitationClick: (invitation: InvitationListItem) => void;
  className?: string;
}) {
  return (
    <ul className={`divide-y divide-border/40 ${className ?? ""}`}>
      {invitations.map((invitation) => {
        const status = resolveInvitationUiStatus(invitation, now);
        const badge = getStatusBadgeInfo(status);
        const name = invitation.details?.name;

        return (
          <li key={invitation.id}>
            <button
              type="button"
              onClick={() => onInvitationClick(invitation)}
              className="flex w-full items-center gap-3 py-2.5 text-left transition-colors active:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {name ?? invitation.email}
                </p>
                {name && (
                  <p className="truncate text-xs text-muted-foreground">
                    {invitation.email}
                  </p>
                )}
              </div>

              {/* Badge uniquement si le statut sort de l'ordinaire (ex. expirée) */}
              {status !== "PENDING" && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${INVITATION_BADGE_CLASSES[badge.variant]}`}
                >
                  {badge.label}
                </span>
              )}

              <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
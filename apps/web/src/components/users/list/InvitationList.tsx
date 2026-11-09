// apps/web/src/components/users/list/InvitationList.tsx
import type { InvitationListItem } from "@/modules/invitation";

import { resolveInvitationUiStatus } from "@/modules/invitation/policy";
import { getStatusBadgeInfo, INVITATION_BADGE_CLASSES } from "@/modules/invitation/status";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

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
  if (invitations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune invitation pour cette classe.
      </p>
    );
  }

  return (
    <ul className={`divide-y rounded-lg border ${className ?? ""}`}>
      {invitations.map((invitation) => {
        const status = resolveInvitationUiStatus(invitation, now);
        const badge = getStatusBadgeInfo(status);

        return (
          <li key={invitation.id}>
            <button
              type="button"
              onClick={() => onInvitationClick(invitation)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <div className="min-w-0">
                {invitation.details?.name && (
                  <p className="truncate text-sm font-medium">
                    {invitation.details.name}
                  </p>
                )}
                <p className="truncate text-sm">{invitation.email}</p>
                <p className="text-xs text-muted-foreground">
                  Envoyée le{" "}
                  <time dateTime={invitation.createdAt.toISOString()}>
                    {dateFormat.format(invitation.createdAt)}
                  </time>
                  {invitation.expiresAt && (
                    <>
                      {" · "}expire le{" "}
                      <time dateTime={invitation.expiresAt.toISOString()}>
                        {dateFormat.format(invitation.expiresAt)}
                      </time>
                    </>
                  )}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${INVITATION_BADGE_CLASSES[badge.variant]}`}
              >
                {badge.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}


// src/components/users/list/InvitationDrawer.tsx
"use client";

import { useState } from "react";
import { Loader2, RotateCw, X, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { InvitationListItem } from "@/modules/invitation";
import {
  INVITATION_BADGE_CLASSES,
  getStatusBadgeInfo,
} from "@/modules/invitation/status";
import { resolveInvitationUiStatus } from "@/modules/invitation/policy";

const invitationDateTimeFormat = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
});

interface InvitationDrawerProps {
  invitation: InvitationListItem | null;
  classLabel: string;
  now: Date;
  resendPending: boolean;
  revokePending: boolean;
  onResend: (invitation: InvitationListItem) => void;
  onRevoke: (
    invitation: InvitationListItem,
    closeInvitation: () => void,
  ) => void;
  onClose: () => void;
}

export function InvitationDrawer({
  invitation,
  classLabel,
  now,
  resendPending,
  revokePending,
  onResend,
  onRevoke,
  onClose,
}: InvitationDrawerProps) {
  const [isConfirmingRevoke, setIsConfirmingRevoke] = useState(false);
  const isPending = resendPending || revokePending;
  const status = invitation
    ? resolveInvitationUiStatus(invitation, now)
    : null;
  const badge = status ? getStatusBadgeInfo(status) : null;
  const canManageInvitation = status === "PENDING" || status === "EXPIRED";

  const close = () => {
    setIsConfirmingRevoke(false);
    onClose();
  };

  return (
    <Drawer
      open={invitation !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) close();
      }}
    >
      <DrawerContent className="mt-0 flex h-dvh min-h-dvh max-h-none flex-col rounded-none border-0 p-0">
        {invitation && badge && (
          <>
            <DrawerHeader className="shrink-0 flex-row items-start justify-between border-b p-6 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
              <div className="min-w-0 space-y-2">
                {invitation.details?.name && (
                  <p className="truncate text-sm text-muted-foreground">
                    {invitation.details.name}
                  </p>
                )}
                <DrawerTitle className="break-all">
                  {invitation.email}
                </DrawerTitle>
                <DrawerDescription>
                  Invitation pour {classLabel}
                </DrawerDescription>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${INVITATION_BADGE_CLASSES[badge.variant]}`}
                >
                  {badge.label}
                </span>
              </div>
              <DrawerClose
                aria-label="Fermer les détails de l’invitation"
                className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </DrawerClose>
            </DrawerHeader>

            <dl className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
              <div className="space-y-1">
                <dt className="text-sm text-muted-foreground">Classe</dt>
                <dd className="text-sm font-medium">{classLabel}</dd>
              </div>

              {invitation.details?.enrollment?.parentEmail && (
                <div className="space-y-1">
                  <dt className="text-sm text-muted-foreground">
                    E-mail du parent
                  </dt>
                  <dd className="break-all text-sm font-medium">
                    {invitation.details.enrollment.parentEmail}
                  </dd>
                </div>
              )}

              <div className="space-y-1">
                <dt className="text-sm text-muted-foreground">Statut</dt>
                <dd className="text-sm font-medium">
                  {badge.label}
                  {badge.description && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      · {badge.description}
                    </span>
                  )}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-sm text-muted-foreground">Envoyée le</dt>
                <dd className="text-sm font-medium">
                  <time dateTime={invitation.createdAt.toISOString()}>
                    {invitationDateTimeFormat.format(invitation.createdAt)}
                  </time>
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-sm text-muted-foreground">Expire le</dt>
                <dd className="text-sm font-medium">
                  {invitation.expiresAt ? (
                    <time dateTime={invitation.expiresAt.toISOString()}>
                      {invitationDateTimeFormat.format(invitation.expiresAt)}
                    </time>
                  ) : (
                    "Aucune échéance"
                  )}
                </dd>
              </div>

              {invitation.usedAt && (
                <div className="space-y-1">
                  <dt className="text-sm text-muted-foreground">
                    Date de réponse
                  </dt>
                  <dd className="text-sm font-medium">
                    <time dateTime={invitation.usedAt.toISOString()}>
                      {invitationDateTimeFormat.format(invitation.usedAt)}
                    </time>
                  </dd>
                </div>
              )}
            </dl>

            {canManageInvitation && (
              <DrawerFooter className="mt-0 shrink-0 border-t p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                {isConfirmingRevoke ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Révoquer cette invitation ? Son lien ne sera plus
                      utilisable.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsConfirmingRevoke(false)}
                        disabled={isPending}
                      >
                        Garder l’invitation
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => onRevoke(invitation, close)}
                        disabled={isPending}
                      >
                        {revokePending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <XCircle className="size-4" />
                        )}
                        Confirmer la révocation
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => onResend(invitation)}
                      disabled={isPending}
                    >
                      {resendPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RotateCw className="size-4" />
                      )}
                      Relancer l’invitation
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsConfirmingRevoke(true)}
                      disabled={isPending}
                    >
                      <XCircle className="size-4" />
                      Révoquer
                    </Button>
                  </div>
                )}
              </DrawerFooter>
            )}
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

"use client";

import type { ComponentType } from "react";
import { Inbox } from "lucide-react";
import { Button } from "../../ui/button";
import { Link as DefaultLink, type LinkProps } from "../../ui/link";
import { useInboxReturnPath } from "../../../hooks/useInboxReturnPath";

export type InboxLinkProps = Omit<LinkProps, "href"> & {
  href: string;
};

export interface InboxButtonProps {
  pathname: string;
  fallbackHref: string;
  unreadCount?: number;
  LinkComponent?: ComponentType<InboxLinkProps>;
  inboxHref?: string;
}

/**
 * Bouton d'en-tête agissant comme toggle entre la route courante et la boîte de réception.
 */
export function InboxButton({
  pathname,
  fallbackHref,
  unreadCount = 0,
  LinkComponent = DefaultLink,
  inboxHref = "/inbox",
}: InboxButtonProps) {
  const { isActive, returnTo, remember } = useInboxReturnPath(
    pathname,
    fallbackHref,
    inboxHref,
  );

  const href = isActive ? returnTo : inboxHref;

  return (
    <Button
      asChild
      variant="outline"
      size="icon"
      className="relative rounded-full"
      aria-label="Boîte de réception"
    >
      <LinkComponent
        href={href}
        title="Boîte de réception"
        onClick={isActive ? undefined : remember}
      >
        <Inbox aria-hidden="true" className="size-4" />

        {unreadCount > 0 && (
          <span className="absolute left-full top-0 size-5 -translate-x-1/2 -translate-y-1/2 shrink-0 p-0 inline-flex items-center justify-center leading-none rounded-full border-2 border-transparent text-[10px] font-semibold bg-primary text-primary-foreground select-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </LinkComponent>
    </Button>
  );
}

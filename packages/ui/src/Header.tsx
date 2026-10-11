"use client";

import type { ReactNode } from "react";
import { ModeToggle } from "./components/layout/Header/ModeToggle";
import {
  AuthButtonPopover,
  type HeaderUser,
} from "./components/layout/Header/AuthButtonPopover";
import { Link } from "./components/ui/link";
import { cn } from "./lib/utils";

export type { HeaderUser };

export type HeaderProps = {
  user?: HeaderUser;
  onSignOut?: () => void | Promise<void>;
  notifications?: ReactNode;
  brandHref?: string;
  className?: string;
};

export function Header({
  user,
  onSignOut,
  notifications,
  brandHref,
  className,
}: HeaderProps) {
  const orgSlug =
    user?.organization?.slug ??
    (user?.user_metadata as Record<string, any> | undefined)?.organization?.slug;
  const orgHref = brandHref ?? (orgSlug ? `/${orgSlug}` : "/");
  const orgLabel =
    user?.organization?.name ??
    (user?.user_metadata as Record<string, any> | undefined)?.organization?.name ??
    "Attendancy";

  return (
    <header
      className={cn(
        "z-50 flex h-14 w-full shrink-0 items-center border-b border-border/20 bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex w-full items-center justify-between px-4">
        {/* Brand / Logo */}
        <Link
          href={orgHref}
          className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-fill-faint"
        >
          <span className="grid size-7 place-items-center rounded border border-border/30 bg-muted text-xs font-bold">
            A
          </span>
          <span className="text-sm font-medium text-text-primary">{orgLabel}</span>
        </Link>

        {/* Actions à droite */}
        <div className="flex items-center gap-1">
          <ModeToggle />
          {notifications}
          {user && <AuthButtonPopover user={user} onSignOut={onSignOut} />}
        </div>
      </div>
    </header>
  );
}

export default Header;

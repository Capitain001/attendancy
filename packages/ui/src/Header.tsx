"use client";

import type { ReactNode } from "react";
import type { PublicUserInfo } from "@attendancy/types";
import { WifiOff } from "lucide-react";
import { ModeToggle } from "./components/layout/Header/ModeToggle";
import { AuthButtonPopover } from "./components/layout/Header/AuthButtonPopover";
import { Link } from "./components/ui/link";
import { cn } from "./lib/utils";

const DEFAULT_BRAND = "Attendancy";

export type HeaderProps = {
  user?: PublicUserInfo;
  onSignOut?: () => void | Promise<void>;
  notifications?: ReactNode;
  brandHref?: string;
  className?: string;
  isOffline?: boolean;
};

export function Header({
  user,
  onSignOut,
  notifications,
  brandHref,
  className,
  isOffline = false,
}: HeaderProps) {
  const org = user?.organization;
  const orgHref = brandHref ?? (org?.slug ? `/${org.slug}` : "/");
  const orgLabel = org?.name ?? DEFAULT_BRAND;

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
          {isOffline && (
            <span
              role="status"
              aria-label="Session hors ligne"
              title="Session hors ligne"
              className="grid size-9 place-items-center text-muted-foreground"
            >
              <WifiOff className="size-4" aria-hidden="true" />
            </span>
          )}
          <ModeToggle />
          {notifications}
          {user && <AuthButtonPopover user={user} onSignOut={onSignOut} />}
        </div>
      </div>
    </header>
  );
}

export default Header;

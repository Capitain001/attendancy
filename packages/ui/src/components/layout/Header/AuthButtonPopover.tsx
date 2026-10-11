"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { MirrorHover } from "../../design/MirrorHover";
import { UserIcon } from "../../users/UserIcon";
import { AuthMenu } from "./AuthMenu";
import { logout } from "@attendancy/auth";
import { cn } from "../../../lib/utils";
import type { UserStatus } from "@attendancy/types";

export type HeaderUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  updated_at?: string | number | Date | null;
  status?: UserStatus;
  role?: string;
  organization?: {
    name?: string | null;
    slug?: string | null;
  } | null;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    organization?: { name?: string; slug?: string };
    [key: string]: unknown;
  };
};

export interface AuthButtonPopoverProps {
  user: HeaderUser;
  className?: string;
  onSignOut?: () => void | Promise<void>;
  orgInfoUrl?: string;
}

export function AuthButtonPopover({
  user,
  className,
  onSignOut,
  orgInfoUrl,
}: AuthButtonPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      if (onSignOut) {
        await onSignOut();
      } else {
        await logout();
      }
    } finally {
      setIsLoggingOut(false);
      setOpen(false);
    }
  };

  const displayName = user.name ?? user.user_metadata?.name;
  const displayAvatar = user.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined);

  return (
    <div className={cn("group flex items-center gap-4", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label="Menu utilisateur"
          >
            <MirrorHover className="flex items-center rounded-full">
              <UserIcon
                name={displayName}
                avatarUrl={displayAvatar}
                updatedAt={user.updated_at}
                status={user.status}
                className="size-9 border border-border/40 bg-muted ring-0"
              />
            </MirrorHover>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={16}
          alignOffset={10}
          className="p-0 pattern-noise border-0 w-64 shadow-[var(--shadow-card)]"
        >
          <AuthMenu
            user={user}
            onSignOut={handleSignOut}
            isLoggingOut={isLoggingOut}
            onItemClick={() => setOpen(false)}
            orgInfoUrl={orgInfoUrl}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default AuthButtonPopover;

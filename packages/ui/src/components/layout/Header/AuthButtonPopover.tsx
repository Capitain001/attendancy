"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { MirrorHover } from "../../design/MirrorHover";
import { UserIcon } from "../../users/UserIcon";
import { AuthMenu } from "./AuthMenu";
import { logout } from "@attendancy/auth";
import { cn } from "../../../lib/utils";
import type { PublicUserInfo } from "@attendancy/types";

export interface AuthButtonPopoverProps {
  user: PublicUserInfo;
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
                name={user.name}
                avatarUrl={user.avatar_url}
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

"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MirrorHover } from "@/components/design";
import UserIcon from "@/components/users/UserIcon";
import { AuthMenu } from "@/components/users/UserButton/AuthMenu";
import { UserInfo } from "@/types/user";
import { cn, getUserInitials } from "@/lib/utils";
import { getInitials } from "@/components/classes/direction/section/ui";

interface AuthButtonPopoverProps {
user: UserInfo;
className?: string;
}

export function AuthButtonPopover({ user, className }: AuthButtonPopoverProps) {
return (
<div className={cn("group flex items-center gap-4", className)}>
  <Popover>
    <PopoverTrigger>
      <MirrorHover className="flex items-center rounded-full ">
      {/* if demo : grayscale */}

        {/* 
        <span className="duration-800 max-w-0 overflow-hidden text-sm font-medium opacity-0 transition-all group-hover:mr-4 group-hover:max-w-[150px] group-hover:opacity-100">
          <h1 className="mx-1 truncate text-sm font-medium">{user.name}</h1>
          <h1 className="mx-1 text-center text-xs font-bold text-muted-foreground/70">
            {user.role}
          </h1>
        </span> */}
        <UserIcon name={user.name} className="size-9 border-1 border-border/40 bg-muted ring-0" />

      </MirrorHover>
    </PopoverTrigger>

    <PopoverContent align="start" showArrow={false} side="bottom" sideOffset={16} alignOffset={10} className="p-0 pattern-noise border-0 w-64">
      <AuthMenu user={user} />
    </PopoverContent>
  </Popover>
</div>
);
}
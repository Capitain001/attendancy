"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MirrorHover } from "@/components/design";
import UserIcon from "@/components/users/UserIcon";
import { AuthMenu } from "@/components/users/UserButton/AuthMenu";
import { UserInfo } from "@/types/user";
import { cn } from "@/lib/utils";

interface AuthButtonPopoverProps {
user: UserInfo;
className?: string;
}

export function AuthButtonPopover({ user, className }: AuthButtonPopoverProps) {
return (
<div className={cn("group flex items-center gap-4", className)}>
  <Popover>
    <PopoverTrigger>
      <MirrorHover className="flex items-center rounded-full border border-foreground/40 p-[2px]">
      {/* if demo : grayscale */}
        <UserIcon name={user.name} avatarUrl={user.avatar_url} className="" />
        <span className="duration-800 max-w-0 overflow-hidden text-sm font-medium opacity-0 transition-all group-hover:mr-4 group-hover:max-w-[150px] group-hover:opacity-100">
          <h1 className="mx-1 truncate text-sm font-medium">{user.name}</h1>
          <h1 className="mx-1 text-center text-xs font-bold text-muted-foreground/70">
            {user.role}
          </h1>
        </span>
      </MirrorHover>
    </PopoverTrigger>

    <PopoverContent align="center" className="p-0 pattern-noise border-0 w-64">
      <AuthMenu user={user} />
    </PopoverContent>
  </Popover>
</div>
);
}
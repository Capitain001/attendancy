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
        <UserIcon name={user.name} status={"PENDING"} className="size-9 border-1 border-border/40 bg-muted ring-0" />
      </MirrorHover>
    </PopoverTrigger>

    <PopoverContent align="start" showArrow={false} side="bottom" sideOffset={16} alignOffset={10} className="p-0 pattern-noise border-0 w-64">
      <AuthMenu user={user} />
    </PopoverContent>
  </Popover>
</div>
);
}
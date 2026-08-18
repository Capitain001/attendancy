"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import UserIcon from "./UserIcon";
import { cn } from "@/lib/utils";

export interface TeacherIconProps {
  avatarUrl?: string | null;
  name?: string;
  email?: string | null;
  className?: string;
}

export function UserInfoPopover({avatarUrl, name, email, className}:TeacherIconProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
      <span className="p-0 rounded-full" >  <UserIcon  className={cn(className)} avatarUrl={avatarUrl} name={name} /></span>
      </PopoverTrigger>

      <PopoverContent className="w-fit scrollbar-hide" side="top" align="center" showArrow={true}>
        <h1 className="text-xs font-semibold"> {name}  </h1>
        <h2 className="text-sm text-muted-foreground">{email}</h2>
      </PopoverContent>
    </Popover>
  );
}

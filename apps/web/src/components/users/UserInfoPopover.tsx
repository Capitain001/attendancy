"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import UserIcon from "./UserIcon";
import { TeacherIconProps } from "@/types/teacher";
import { cn } from "@/lib/utils";


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

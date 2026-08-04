"use client";

import { cn } from "@/lib/utils";
import { UserIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserInfo } from "@/types";



interface OnlineStatsProps {
  user: UserInfo;
}

export const OnlineStats = ({ user }: OnlineStatsProps) => {
  if (!user?.isConnected) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative h-5 w-5">
            <UserIcon className="h-5 w-5 text-green-500" />
            <span
              className={cn(
                "pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded bg-white px-2 py-1 text-xs text-muted-foreground opacity-0 shadow transition-opacity",
                "group-hover:opacity-100",
              )}
            >
              En ligne depuis {formatTime(user.online_at)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{user.name ?? user.email}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

function formatTime(isoDate?: string) {
  if (!isoDate) return "un moment";
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

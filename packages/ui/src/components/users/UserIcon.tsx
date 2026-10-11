import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "../../lib/utils";
import { getRefreshUrl } from "../../lib/url";
import type { UserStatus } from "@attendancy/types";

export type { UserStatus };

export interface UserIconProps {
  id?: string;
  name?: string | null;
  avatarUrl?: string | null;
  updatedAt?: string | number | Date | null;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showOnline?: boolean;
  status?: UserStatus;
}

export function UserIcon({
  name,
  avatarUrl,
  updatedAt,
  className,
  style,
  fill,
  status,
  showOnline,
}: UserIconProps) {
  const fallback = name?.charAt(0)?.toUpperCase() || "U";
  const src = getRefreshUrl(avatarUrl, updatedAt) ?? undefined;

  return (
    <div
      className={cn(
        "relative group cursor-pointer aspect-square rounded-full border-2 overflow-hidden",
        !fill && "size-10",
        fill && "w-full h-full",
        status === "PENDING" && "grayscale",
        className,
      )}
      style={style}
    >
      <Avatar className="w-full h-full">
        <AvatarImage
          src={src}
          alt={name || "User"}
          className="object-cover w-full h-full filter-[inherit]"
        />
        <AvatarFallback className="text-xs font-medium">
          {fallback}
        </AvatarFallback>
      </Avatar>

      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      </div>

      {showOnline && (
        <span className="absolute bottom-0 inset-e-0 size-3 rounded-full border-2 border-background bg-emerald-500 z-10" />
      )}
    </div>
  );
}

export default UserIcon;

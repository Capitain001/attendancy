import React from "react";
import { Skeleton } from "@/components/users/avatars/skeleton-1";
import clsx from "clsx";
import { getRoleColor } from "@/lib/project";
import { Role } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

interface AvatarProps {
  placeholder?: boolean;
  size?: number;
  src?: string;
  role?: Role;
}

export const Avatar = ({ placeholder = false, size = 24, src, role }: AvatarProps) => {
  if (placeholder) {
    return (
      <Skeleton rounded height={size} width={size} className="border border-gray-alpha-400" />
    );
  }

  return (
    <span
      className="rounded-full inline-block overflow-hidden border-2 border-gray-alpha-400 duration-200"
      style={{ width: size, height: size, borderColor: getRoleColor(role || "STUDENT") }}
    >
      {src && (
        <img
          src={src}
          alt="Avatar"
          className="w-full h-full"
        />
      )}
    </span>
  );
};


interface AvatarGroupProps {
  members: {
    username?: string;
    src?: string;
    role?: Role;
  }[];
  size?: number;
  limit?: number;
  className?: string
}

export const AvatarGroup = ({ members, size=24, limit = 3 , className }: AvatarGroupProps) => {
  const visibleMembers = members.length >= limit ? members.slice(0, limit - 1) : members;
  const remainingCount = members.length > limit ? members.length - limit + 1 : 0;

  return (
    <div className={cn("flex items-center", className)}>
      {visibleMembers.map((member, index) => (
        <span
          key={member.username || index}
          className={clsx("inline-flex items-center", index !== 0 && "-ml-2")}
          style={{ zIndex: index + 1 }}
          aria-label={`Avatar for ${member.username || `member-${index}`}`}
        >
          <Avatar
            src={member.src}
            size={size}
            placeholder={!member.src}
            role={member.role}
          />
          
        </span>
      ))}
      {members.length === limit && (
        <span
          className="inline-flex items-center -ml-2"
          style={{ zIndex: limit }}
          aria-label="1 more avatars in this group"
        >
          <Avatar
            src="https://vercel.com/api/www/avatar?u=rauchg&s=64"
            size={size}
          />
        </span>
      )}
      {remainingCount > 0 && (
        <span
          className="inline-flex items-center -ml-2 dark"
          style={{ zIndex: limit }}
          aria-label={`${remainingCount} more avatars in this group`}
        >
          <span
            className="rounded-full overflow-hidden border border-gray-400 bg-gray-100 duration-200 flex justify-center items-center text-gray-1000 text-[0.625rem] leading-3 font-semibold"
            style={{ width: size, height: size }}
          >
            +{remainingCount}
          </span>
        </span>
      )}
    </div>
  );
};

import React from "react";
import { Skeleton } from "@/components/users/avatars/skeleton-1";
import clsx from "clsx";
import { getRoleColor } from "@/lib/project";
import { getNameColor } from "@/lib/utils";
import { Role } from "@/generated/prisma/client";

interface AvatarProps {
  placeholder?: boolean;
  size?: number;
  src?: string;
  role?: Role;
  username?: string;
}

export const Avatar = ({ placeholder = false, size = 24, src, role, username }: AvatarProps) => {
  if (placeholder) {
    return (
      <Skeleton rounded height={size} width={size} className="border border-gray-alpha-400" />
    );
  }

  // Utiliser la couleur du rôle si disponible, sinon une couleur stable basée sur le username
  const borderColor = role 
    ? getRoleColor(role) 
    : getNameColor(username || "default");

  return (
    <span
      className="rounded-full inline-block overflow-hidden border-2 border-gray-alpha-400 duration-200"
      style={{ width: size, height: size, borderColor }}
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


interface LiveAvatarsProps {
  members: {
    username?: string;
    src?: string;
    role?: Role;
  }[];
  size?: number;
  limit?: number;
}

export const LiveAvatars = ({ members, size=24, limit = 3 }: LiveAvatarsProps) => {
  const visibleMembers = members.length >= limit ? members.slice(0, limit - 1) : members;
  const remainingCount = members.length > limit ? members.length - limit + 1 : 0;

  return (
    <div className="flex items-center">
      {visibleMembers.map((member, index) => (
        <span
          key={`${member.username || "member"}-${index}`}
          className={clsx("inline-flex items-center", index !== 0 && "-ml-2")}
          style={{ zIndex: index + 1 }}
          aria-label={`Avatar for ${member.username || `member-${index}`}`}
          title={member.username || "Utilisateur"}
        >
          <Avatar
            src={member.src}
            size={size}
            placeholder={!member.src}
            role={member.role}
            username={member.username}
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

// components/UserIcon.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { OnlineStatus } from "./OnlineStatus.client";

type UserIconProps = {
  userId: string;
  avatarUrl?: string;
  className?: string;
  name?: string;
};

export function LiveUserIcon({ userId, avatarUrl, className = "", name }: UserIconProps) {
  return (
    <div className={`relative ${className}`}>
      <Avatar className="rounded-full border">
          <AvatarImage src={avatarUrl || "/avatar.png"} alt={name || "profile"} />
        <AvatarFallback>{name?.[0] || " "}</AvatarFallback>
      </Avatar>

      {/* Affichage du statut en temps réel */}
      {/* <OnlineStatus userId={userId} /> */}
    </div>
  );
}
